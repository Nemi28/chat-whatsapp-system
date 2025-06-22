const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Message = require("../models/Message");
const User = require("../models/User");

require("dotenv").config();

// ========== VERIFICACIÓN GET ==========
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "123456";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Webhook no verificado");
  res.sendStatus(403);
});

// ========== FUNCIÓN PARA CREAR DIRECTORIOS SI NO EXISTEN ==========
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
};

// ========== FUNCIÓN PARA DESCARGAR MEDIA ==========
const downloadMedia = async (mediaId, tipo, mensaje) => {
  try {
    const token = process.env.WHATSAPP_TOKEN;

    // Obtener URL del archivo
    const mediaRes = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const url = mediaRes.data.url;

    // Determinar extensión según el tipo
    let extension = "";
    switch (tipo) {
      case "image":
        extension = ".jpg";
        break;
      case "audio":
        extension = ".ogg";
        break;
      case "video":
        extension = ".mp4";
        break;
      case "document":
        extension = mensaje.document?.filename
          ? path.extname(mensaje.document.filename)
          : ".pdf";
        break;
      default:
        extension = "";
    }

    // Crear nombre y ruta del archivo
    const filename = `${tipo}-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}${extension}`;
    const folder = `uploads/${tipo}s/`; // images, audios, videos, documents
    const filepath = path.join(folder, filename);

    // Asegurar que el directorio existe
    ensureDirectoryExists(folder);

    // Descargar el archivo
    const download = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "stream",
    });

    // Guardar el archivo
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      download.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Crear metadata
    const metadata = {
      originalName: mensaje.document?.filename || filename,
      url: url,
      mimetype:
        mensaje.document?.mime_type ||
        mensaje.image?.mime_type ||
        mensaje.audio?.mime_type ||
        mensaje.video?.mime_type ||
        "",
      size:
        mensaje.document?.size ||
        mensaje.image?.size ||
        mensaje.audio?.size ||
        mensaje.video?.size ||
        null,
      downloadedAt: new Date().toISOString(),
    };

    console.log(`💾 Archivo descargado: ${filepath}`);

    return {
      media_url: filepath.replace(/\\/g, "/"),
      metadata: metadata,
    };
  } catch (error) {
    console.error("❌ Error descargando media:", error);
    return { media_url: null, metadata: null };
  }
};

// ========== FUNCIÓN PARA OBTENER O CREAR USUARIO ==========
const getOrCreateUser = async (wa_id, name) => {
  try {
    // Buscar usuario existente
    let user = await User.findOne({ where: { phone: wa_id } });

    if (!user) {
      console.log(
        `👤 Usuario no encontrado para ${wa_id}, creando uno nuevo...`
      );

      // Crear nuevo usuario
      user = await User.create({
        nombre: name || "Usuario WhatsApp",
        email: `${wa_id}@whatsapp.com`,
        password: wa_id, // Considera usar bcrypt para encriptar
        phone: wa_id,
        rol: "user",
        activo: true,
      });

      console.log(`✅ Usuario creado: ${user.nombre} (${wa_id})`);
    } else {
      // Actualizar nombre si cambió
      if (name && user.nombre !== name) {
        user.nombre = name;
        await user.save();
        console.log(`📝 Nombre actualizado para ${wa_id}: ${name}`);
      }
    }

    return user;
  } catch (error) {
    console.error("❌ Error obteniendo/creando usuario:", error);
    throw error;
  }
};

// ========== POST: RECEPCIÓN DE MENSAJES ==========
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Validar que es un mensaje de WhatsApp Business
    if (data.object !== "whatsapp_business_account") {
      return res.sendStatus(200);
    }

    // Procesar cada entrada
    for (const entry of data.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const messages = value?.messages;
        const contacts = value?.contacts;

        // Validar que hay mensajes y contactos
        if (
          !messages ||
          !contacts ||
          messages.length === 0 ||
          contacts.length === 0
        ) {
          continue;
        }

        // Extraer información del contacto y mensaje
        const contact = contacts[0];
        const mensaje = messages[0];

        const wa_id = contact?.wa_id;
        const name = contact?.profile?.name;

        if (!wa_id || !mensaje) {
          console.warn("⚠️ Datos incompletos en el mensaje");
          continue;
        }

        const tipo = mensaje.type;
        console.log(
          `📥 Mensaje recibido de: ${wa_id} | Tipo: ${tipo} | Nombre: ${name}`
        );

        // Validar tipo de mensaje soportado
        const tiposPermitidos = ["text", "image", "audio", "document", "video"];
        if (!tiposPermitidos.includes(tipo)) {
          console.warn(`⚠️ Tipo de mensaje no soportado: ${tipo}`);
          continue;
        }

        // Obtener contenido según el tipo
        let content = "";
        switch (tipo) {
          case "text":
            content = mensaje.text?.body || "";
            break;
          case "image":
            content = mensaje.image?.caption || "Imagen recibida";
            break;
          case "audio":
            content = "Audio recibido";
            break;
          case "video":
            content = mensaje.video?.caption || "Video recibido";
            break;
          case "document":
            content = mensaje.document?.filename || "Documento recibido";
            break;
          default:
            content = "Contenido multimedia recibido";
        }

        // Obtener o crear usuario
        const user = await getOrCreateUser(wa_id, name);

        // Procesar archivo multimedia si aplica
        let media_url = null;
        let metadata = null;

        if (["image", "audio", "document", "video"].includes(tipo)) {
          const mediaId =
            mensaje.image?.id ||
            mensaje.audio?.id ||
            mensaje.document?.id ||
            mensaje.video?.id;

          if (mediaId) {
            const mediaResult = await downloadMedia(mediaId, tipo, mensaje);
            media_url = mediaResult.media_url;
            metadata = mediaResult.metadata;
          }
        }

        // Guardar mensaje en la base de datos
        const nuevoMensaje = await Message.create({
          user_id: user.id,
          receiver_id: null, // Mensaje entrante, no tiene receptor
          type: tipo,
          content: content,
          media_url: media_url,
          metadata: metadata ? JSON.stringify(metadata) : null,
          leido: false,
          editado: false,
        });

        console.log(
          `✅ Mensaje guardado: ID ${nuevoMensaje.id} | Usuario: ${user.nombre}`
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error procesando el webhook:", error);
    console.error("Stack trace:", error.stack);
    res.sendStatus(500);
  }
});

module.exports = router;
