// src/services/api.js
import axios from "axios";

// Configuración base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("📡 Petición API:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log("📦 Respuesta API:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Error API:", error.response?.status, error.config?.url);

    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Función helper para crear FormData
const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  return formData;
};

// Servicios de la API
export const apiService = {
  // Usuarios y conversaciones
  async getUsuariosConversaciones() {
    console.log("🔍 Llamando a getUsuariosConversaciones...");
    const response = await api.get("/api/messages/conversaciones/usuarios");
    console.log("📋 Respuesta conversaciones:", response.data);
    return response.data.success ? response.data.data : response.data;
  },

  // Nuevo método para obtener todos los usuarios
  async getTodosLosUsuarios() {
    console.log("🔍 Llamando a getTodosLosUsuarios...");
    const response = await api.get("/api/messages/usuarios/todos");
    console.log("📋 Respuesta todos usuarios:", response.data);
    return response.data.success ? response.data.data : response.data;
  },

  // Mensajes
  async getMensajesUsuario(userId) {
    console.log("🔍 Obteniendo mensajes para usuario:", userId);
    const response = await api.get(`/api/messages/${userId}`);
    return response.data.success ? response.data.data : response.data;
  },

  async enviarMensaje(data) {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    const formData = createFormData(data);
    const response = await api.post("/api/messages", formData, config);
    return response.data.success ? response.data.data : response.data;
  },

  async eliminarMensaje(messageId) {
    const response = await api.delete(`/api/messages/${messageId}`);
    return response.data;
  },

  // Autenticación
  async login(credentials) {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  async register(userData) {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  async logout() {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },
};

// Función para construir URLs de media
export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return "";
  const baseUrl = import.meta.env.VITE_MEDIA_BASE_URL;
  return `${baseUrl}/${mediaPath}`;
};

// Constantes de configuración
export const config = {
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  socketUrl: import.meta.env.VITE_SOCKET_URL,
  appTitle: import.meta.env.VITE_APP_TITLE || "Mi Chat",
  debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
};

export default api;
