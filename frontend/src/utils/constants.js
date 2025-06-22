// utils/constants.js

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/gif": "image",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/webm": "audio",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "document",
  "text/plain": "document",
};

// Tamaños de archivo
export const FILE_SIZES = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
};

// Tipos de mensaje
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  DOCUMENT: "document",
};

// Estados de conexión
export const CONNECTION_STATES = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

// Eventos de socket
export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  JOIN: "join",
  NUEVO_MENSAJE: "nuevo_mensaje",
  MENSAJE_ELIMINADO: "mensaje_eliminado",
  USER_TYPING: "user_typing",
  USER_STOP_TYPING: "user_stop_typing",
};

// Rutas de la API
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
  },
  MESSAGES: {
    BASE: "/api/messages",
    BY_USER: "/api/messages/:userId",
    CONVERSATIONS: "/api/messages/conversaciones/usuarios",
    DELETE: "/api/messages/:messageId",
  },
  USERS: {
    BASE: "/api/users",
    PROFILE: "/api/users/profile",
    SEARCH: "/api/users/search",
  },
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  DURATION: 5000,
  POSITION: "top-right",
};

// Configuración de audio
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 44100,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  FFT_SIZE: 256,
};

// Reglas de validación
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
  },
  MESSAGE: {
    MAX_LENGTH: 1000,
  },
};
