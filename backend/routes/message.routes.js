const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const verifyToken = require("../middlewares/authMiddleware");
const Message = require("../models/Message");
const User = require("../models/User");

// ============================================
// IMPORTAR VALIDACIONES
// ============================================
const {
  validateMessage,
  validateUserId,
  validateMessageId,
  validateFileUpload,
  sanitizeMessageContent,
} = require("../middlewares/validators");

// ============================================
// CREAR CARPETAS DE UPLOADS
// ============================================
const uploadDirs = [
  "uploads/",
  "uploads/images/",
  "uploads/audio/",
  "uploads/documents/",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Carpeta creada: ${dir}`);
  }
});

// ============================================
// CONFIGURACIÓN MEJORADA DE MULTER
// ============================================
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

// ============================================
// FILTRO MEJORADO PARA ARCHIVOS
// ============================================
const fileFilter = (req, file, cb) => {
  console.log("🔍 Archivo recibido:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Tipos MIME permitidos (completo para audio)
  const allowedMimeTypes = {
    images: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ],
    audio: [
      "audio/mpeg", // MP3
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/ogg",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/x-aac",
      "audio/x-m4a",
      "audio/m4a",
      "audio/3gpp",
      "audio/3gp",
      "audio/amr",
      "audio/amr-nb",
      "audio/amr-wb",
      "audio/opus",
      "audio/x-wav",
      "audio/vnd.wave",
      "audio/flac",
      "audio/x-flac",
    ],
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
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
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

  const mimeAllowed = allAllowedTypes.includes(file.mimetype);
  const extensionAllowed = allowedExtensions.includes(fileExtension);

  if (mimeAllowed || extensionAllowed) {
    console.log("✅ Archivo aceptado:", file.originalname);
    cb(null, true);
  } else {
    console.log("❌ Archivo rechazado:", file.mimetype, fileExtension);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5,
  },
});

// ============================================
// FUNCIÓN AUXILIAR PARA DETERMINAR TIPO
// ============================================
const getFileType = (mimetype, originalname = "") => {
  console.log("🔍 Determinando tipo para:", { mimetype, originalname });

  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";

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

  if (audioExtensions.includes(extension)) return "audio";
  if (imageExtensions.includes(extension)) return "image";

  if (
    mimetype.includes("pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("text") ||
    mimetype.includes("sheet")
  ) {
    return "document";
  }

  return "document";
};

// ============================================
// APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
// ============================================
router.use(verifyToken);

// ============================================
// RUTAS EN ORDEN CORRECTO
// ============================================

// ✅ IMPORTANTE: Rutas específicas PRIMERO, rutas con parámetros DESPUÉS

// 1. Obtener usuarios con conversaciones (DEBE IR PRIMERO)
router.get("/conversaciones/usuarios", async (req, res) => {
  try {
    console.log("📋 Obteniendo usuarios con conversaciones para:", req.user.id);

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
    console.error("❌ Error al obtener usuarios con conversaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener conversaciones",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// 2. Servir archivos estáticos
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

    // Establecer headers apropiados para el tipo de archivo
    if (type === "audio") {
      res.setHeader("Content-Type", "audio/mpeg");
    } else if (type === "images") {
      res.setHeader("Content-Type", "image/jpeg");
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

// 3. Marcar mensajes como leídos (CON VALIDACIÓN)
router.patch("/marcar-leidos/:userId", validateUserId, async (req, res) => {
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

// ============================================
// 4. OBTENER MENSAJES CON UN USUARIO (CON VALIDACIÓN)
// ============================================
router.get("/:userId", validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log("📨 Obteniendo mensajes entre:", req.user.id, "y", userId);

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
      order: [["createdAt", "ASC"]], // Orden cronológico para el chat
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        mensajes,
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
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// 5. CREAR NUEVO MENSAJE (CON TODAS LAS VALIDACIONES)
// ============================================
router.post(
  "/",
  upload.single("archivo"), // 1. Primero multer para manejar archivos
  validateFileUpload, // 2. Validar archivo subido
  sanitizeMessageContent, // 3. Sanitizar contenido de texto
  validateMessage, // 4. Validar datos del mensaje
  async (req, res) => {
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

      // Verificar que el receptor existe
      const receiver = await User.findByPk(receiver_id);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Usuario receptor no encontrado",
        });
      }

      let mensaje = {
        user_id: req.user.id,
        receiver_id: parseInt(receiver_id),
        type: type || "text",
        content: content || null,
        media_url: null,
        metadata: null,
      };

      // Procesar archivo si existe
      if (req.file) {
        const fileType = getFileType(req.file.mimetype, req.file.originalname);

        mensaje.type = fileType;
        mensaje.media_url = req.file.path.replace(/\\/g, "/");
        mensaje.content = req.file.originalname;

        // Metadata adicional del archivo
        const metadata = {
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          uploadPath: req.file.path,
        };

        if (fileType === "audio") {
          console.log("🎵 Procesando archivo de audio:", req.file.originalname);
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
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
);

// ============================================
// 6. ELIMINAR MENSAJE (CON VALIDACIÓN)
// ============================================
router.delete("/:messageId", validateMessageId, async (req, res) => {
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
        messageId: parseInt(messageId),
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

module.exports = router;
