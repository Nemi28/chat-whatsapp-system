const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const verifyToken = require("../middlewares/authMiddleware");
const Message = require("../models/Message");
const User = require("../models/User");

// Crear carpetas de uploads si no existen
const uploadDirs = [
  "uploads/",
  "uploads/images/",
  "uploads/audio/",
  "uploads/documents/",
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración mejorada de multer con organización por tipo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/";

    // Organizar archivos por tipo
    if (file.mimetype.startsWith("image/")) {
      folder = "uploads/images/";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "uploads/audio/";
    } else {
      folder = "uploads/documents/";
    }

    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Generar nombre único con timestamp y random
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Filtro mejorado para archivos con soporte completo para audio
const fileFilter = (req, file, cb) => {
  console.log("🔍 Archivo recibido:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Tipos MIME permitidos (más completo)
  const allowedMimeTypes = {
    // Imágenes
    images: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ],
    // Audio - AMPLIADO para WhatsApp y otros
    audio: [
      "audio/mpeg", // MP3
      "audio/mp3", // MP3 alternativo
      "audio/wav", // WAV
      "audio/wave", // WAV alternativo
      "audio/ogg", // OGG
      "audio/webm", // WebM audio
      "audio/mp4", // M4A/AAC en contenedor MP4
      "audio/aac", // AAC
      "audio/x-aac", // AAC alternativo
      "audio/x-m4a", // M4A
      "audio/m4a", // M4A alternativo
      "audio/3gpp", // 3GP (común en WhatsApp)
      "audio/3gp", // 3GP alternativo
      "audio/amr", // AMR (formato WhatsApp antiguo)
      "audio/amr-nb", // AMR Narrowband
      "audio/amr-wb", // AMR Wideband
      "audio/opus", // Opus
      "audio/x-wav", // WAV alternativo
      "audio/vnd.wave", // WAV estándar
      "audio/flac", // FLAC
      "audio/x-flac", // FLAC alternativo
    ],
    // Documentos
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  };

  // Extensiones permitidas como respaldo
  const allowedExtensions = [
    // Imágenes
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    // Audio
    ".mp3",
    ".wav",
    ".ogg",
    ".webm",
    ".m4a",
    ".aac",
    ".3gp",
    ".amr",
    ".opus",
    ".flac",
    // Documentos
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".csv",
    ".xls",
    ".xlsx",
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allAllowedTypes = [
    ...allowedMimeTypes.images,
    ...allowedMimeTypes.audio,
    ...allowedMimeTypes.documents,
  ];

  // Verificar tanto MIME type como extensión
  const mimeAllowed = allAllowedTypes.includes(file.mimetype);
  const extensionAllowed = allowedExtensions.includes(fileExtension);

  if (mimeAllowed || extensionAllowed) {
    console.log("✅ Archivo aceptado:", file.originalname);
    cb(null, true);
  } else {
    console.log("❌ Archivo rechazado:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
      reason: "Tipo no permitido",
    });
    cb(
      new Error(
        `Tipo de archivo no permitido: ${file.mimetype} (${fileExtension}). Formatos soportados: imágenes, audio y documentos.`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB límite (aumentado para audio)
    files: 5, // máximo 5 archivos
  },
});

// Función auxiliar mejorada para determinar tipo de archivo
const getFileType = (mimetype, originalname = "") => {
  console.log("🔍 Determinando tipo para:", { mimetype, originalname });

  // Verificar por MIME type primero
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";

  // Verificar por extensión como respaldo
  const extension = path.extname(originalname).toLowerCase();
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".ogg",
    ".webm",
    ".m4a",
    ".aac",
    ".3gp",
    ".amr",
    ".opus",
    ".flac",
  ];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv"];

  if (audioExtensions.includes(extension)) return "audio";
  if (imageExtensions.includes(extension)) return "image";
  if (videoExtensions.includes(extension)) return "video";

  // Por defecto para documentos
  if (
    mimetype.includes("pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("text") ||
    mimetype.includes("sheet")
  )
    return "document";

  return "document"; // default
};

// Función para obtener duración de audio (opcional)
const getAudioMetadata = (filePath) => {
  // Aquí podrías usar una librería como 'node-ffprobe' o 'music-metadata'
  // para obtener duración, etc. Por ahora retornamos null
  return null;
};

// ✅ Crear mensaje (texto o archivo) - VERSIÓN MEJORADA PARA AUDIO
router.post("/", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    const { type, content, receiver_id } = req.body;

    console.log("📨 Nueva solicitud de mensaje:", {
      type,
      content: content ? "Texto presente" : "Sin texto",
      receiver_id,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : "Sin archivo",
    });

    // Validaciones mejoradas
    if (!receiver_id || isNaN(receiver_id)) {
      return res.status(400).json({
        success: false,
        message: "receiver_id es requerido y debe ser un número válido",
      });
    }

    // Verificar que el receptor existe
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Usuario receptor no encontrado",
      });
    }

    // Validar que hay contenido o archivo
    if (!req.file && !content) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar contenido de texto o subir un archivo",
      });
    }

    let mensaje = {
      user_id: req.user.id,
      receiver_id: parseInt(receiver_id),
      type: type || "text",
      content: content || null,
      media_url: null,
      metadata: null, // Para guardar información adicional del archivo
    };

    // Procesar archivo si existe
    if (req.file) {
      const fileType = getFileType(req.file.mimetype, req.file.originalname);

      mensaje.type = fileType;
      mensaje.media_url = req.file.path.replace(/\\/g, "/");
      mensaje.content = req.file.originalname; // Guardar nombre original

      // Metadata adicional del archivo
      const metadata = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadPath: req.file.path,
      };

      // Para archivos de audio, agregar metadata específica
      if (fileType === "audio") {
        console.log("🎵 Procesando archivo de audio:", req.file.originalname);
        // Aquí podrías agregar duración, bitrate, etc.
        metadata.duration = getAudioMetadata(req.file.path);
      }

      mensaje.metadata = JSON.stringify(metadata);

      console.log("✅ Archivo procesado:", {
        type: fileType,
        path: mensaje.media_url,
        size: req.file.size,
      });
    }

    const nuevoMensaje = await Message.create(mensaje);

    // Incluir información del remitente en la respuesta
    const mensajeCompleto = await Message.findByPk(nuevoMensaje.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    // Emitir mensaje en tiempo real
    try {
      const io = req.app.get("io");
      console.log("🔍 Estado de io:", io ? "Disponible" : "No disponible");
      console.log("🎯 Receptor ID:", mensaje.receiver_id);

      if (io && mensaje.receiver_id) {
        const roomName = `user_${mensaje.receiver_id}`;
        console.log(`📡 Emitiendo mensaje a sala: ${roomName}`);

        const mensajeParaEmitir = mensajeCompleto || nuevoMensaje;
        io.to(roomName).emit("nuevo_mensaje", mensajeParaEmitir);

        console.log("✅ Mensaje emitido correctamente por Socket.IO");
      } else {
        console.warn("⚠️ Socket.IO no disponible o receiver_id faltante");
      }
    } catch (socketError) {
      console.error("❌ Error al emitir mensaje por Socket.IO:", socketError);
    }

    res.status(201).json({
      success: true,
      message: "Mensaje enviado correctamente",
      data: mensajeCompleto || nuevoMensaje,
    });
  } catch (error) {
    console.error("❌ Error en ruta POST /messages:", error);

    // Manejo específico de errores de multer
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "El archivo es demasiado grande (máximo 50MB)",
      });
    }

    if (
      error.message &&
      error.message.includes("Tipo de archivo no permitido")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Obtener mensajes entre usuario logueado y otro usuario (con paginación)
router.get("/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    // Validar que userId es un número
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario inválido",
      });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: mensajes } = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          {
            user_id: req.user.id,
            receiver_id: userId,
          },
          {
            user_id: userId,
            receiver_id: req.user.id,
          },
        ],
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "nombre", "email"],
        },
      ],
      order: [["createdAt", "DESC"]], // Más recientes primero
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        mensajes: mensajes.reverse(), // Invertir para mostrar cronológicamente
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalMessages: count,
          hasNextPage: offset + parseInt(limit) < count,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener mensajes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener mensajes",
    });
  }
});

// ✅ Obtener usuarios únicos con los que conversó el usuario logueado
router.get("/conversaciones/usuarios", verifyToken, async (req, res) => {
  try {
    // Obtener conversaciones con el último mensaje de cada una
    const conversaciones = await Message.findAll({
      where: {
        [Op.or]: [{ user_id: req.user.id }, { receiver_id: req.user.id }],
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "nombre", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Procesar para obtener usuarios únicos con último mensaje
    const usuariosMap = new Map();

    conversaciones.forEach((msg) => {
      const otherUserId =
        msg.user_id === req.user.id ? msg.receiver_id : msg.user_id;

      if (otherUserId && !usuariosMap.has(otherUserId)) {
        const otherUser =
          msg.user_id === req.user.id ? msg.receiver : msg.sender;

        usuariosMap.set(otherUserId, {
          ...otherUser.toJSON(),
          ultimoMensaje: {
            content: msg.content,
            type: msg.type,
            createdAt: msg.createdAt,
            esPropio: msg.user_id === req.user.id,
          },
        });
      }
    });

    const usuarios = Array.from(usuariosMap.values());

    res.json({
      success: true,
      data: { usuarios },
    });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener conversaciones",
    });
  }
});

// ✅ Marcar mensajes como leídos
router.patch("/marcar-leidos/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.update(
      { leido: true },
      {
        where: {
          user_id: userId,
          receiver_id: req.user.id,
          leido: false,
        },
      }
    );

    res.json({
      success: true,
      message: "Mensajes marcados como leídos",
    });
  } catch (error) {
    console.error("❌ Error al marcar mensajes:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar mensajes como leídos",
    });
  }
});

// ✅ Eliminar mensaje
router.delete("/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const mensaje = await Message.findOne({
      where: {
        id: messageId,
        user_id: req.user.id, // Solo el remitente puede eliminar
      },
    });

    if (!mensaje) {
      return res.status(404).json({
        success: false,
        message: "Mensaje no encontrado o no tienes permisos para eliminarlo",
      });
    }

    // Eliminar archivo físico si existe
    if (mensaje.media_url) {
      try {
        if (fs.existsSync(mensaje.media_url)) {
          fs.unlinkSync(mensaje.media_url);
          console.log("🗑️ Archivo eliminado:", mensaje.media_url);
        }
      } catch (fileError) {
        console.warn("⚠️ Error al eliminar archivo:", fileError.message);
      }
    }

    await mensaje.destroy();

    // Emitir evento de eliminación
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${mensaje.receiver_id}`).emit("mensaje_eliminado", {
        messageId,
      });
    }

    res.json({
      success: true,
      message: "Mensaje eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar mensaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar mensaje",
    });
  }
});

// ✅ Servir archivos estáticos (nueva ruta para archivos de audio)
router.get("/file/:type/:filename", (req, res) => {
  try {
    const { type, filename } = req.params;
    const allowedTypes = ["images", "audio", "documents"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de archivo no válido",
      });
    }

    const filePath = path.join(__dirname, "..", "uploads", type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("❌ Error al servir archivo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener archivo",
    });
  }
});

module.exports = router;
