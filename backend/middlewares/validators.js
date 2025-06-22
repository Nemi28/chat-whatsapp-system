// middlewares/validators.js
const { body, param, validationResult } = require("express-validator");

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("❌ Errores de validación:", errors.array());

    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// ============================================
// VALIDACIONES PARA AUTENTICACIÓN
// ============================================

// Validaciones para registro
const validateRegister = [
  body("nombre")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("El email no puede exceder 100 caracteres"),

  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("La contraseña debe tener entre 6 y 100 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),

  handleValidationErrors,
];

// Validaciones para login
const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 1, max: 100 })
    .withMessage("Contraseña inválida"),

  handleValidationErrors,
];

// ============================================
// VALIDACIONES PARA MENSAJES
// ============================================

// Validaciones para crear mensaje
const validateMessage = [
  body("receiver_id")
    .isInt({ min: 1 })
    .withMessage("receiver_id debe ser un número entero válido"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("El contenido no puede exceder 1000 caracteres")
    .custom((value, { req }) => {
      // Si no hay archivo, el contenido es obligatorio
      if (!req.file && (!value || value.length === 0)) {
        throw new Error("Debe proporcionar contenido de texto o un archivo");
      }
      return true;
    }),

  body("type")
    .optional()
    .isIn(["text", "image", "audio", "document", "video"])
    .withMessage("Tipo de mensaje no válido"),

  handleValidationErrors,
];

// Validaciones para parámetros de usuario
const validateUserId = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("ID de usuario debe ser un número entero válido"),

  handleValidationErrors,
];

// Validaciones para parámetros de mensaje
const validateMessageId = [
  param("messageId")
    .isInt({ min: 1 })
    .withMessage("ID de mensaje debe ser un número entero válido"),

  handleValidationErrors,
];

// ============================================
// VALIDACIONES PARA ARCHIVOS
// ============================================

// Validar archivos subidos
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  const maxSize = 50 * 1024 * 1024; // 50MB

  // Validar tamaño
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: "El archivo es demasiado grande",
      maxSize: "50MB",
      receivedSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    });
  }

  // Tipos de archivo permitidos
  const allowedMimeTypes = [
    // Imágenes
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/m4a",
    "audio/3gpp",
    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Tipo de archivo no permitido",
      allowedTypes:
        "Imágenes, audio, PDF, documentos de Word, archivos de texto",
      receivedType: file.mimetype,
    });
  }

  console.log("✅ Archivo validado:", {
    name: file.originalname,
    type: file.mimetype,
    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
  });

  next();
};

// ============================================
// SANITIZACIÓN DE DATOS
// ============================================

// Sanitizar contenido de mensajes
const sanitizeMessageContent = (req, res, next) => {
  if (req.body.content) {
    // Remover caracteres potencialmente peligrosos
    req.body.content = req.body.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remover scripts
      .replace(/<[^>]*>/g, "") // Remover tags HTML
      .trim();
  }

  next();
};

// ============================================
// EXPORTAR VALIDACIONES
// ============================================

module.exports = {
  // Autenticación
  validateRegister,
  validateLogin,

  // Mensajes
  validateMessage,
  validateUserId,
  validateMessageId,

  // Archivos
  validateFileUpload,

  // Sanitización
  sanitizeMessageContent,

  // Helper
  handleValidationErrors,
};
