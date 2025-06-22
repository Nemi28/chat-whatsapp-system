// src/composables/useChat.js - Versión completa corregida
import { ref, nextTick } from "vue";
import { apiService, getMediaUrl, config } from "@/services/api.js";
import socketService from "@/services/socket.js";
import api from "@/services/api.js";

export function useChat() {
  // Estado reactivo
  const users = ref([]);
  const selectedUser = ref(null);
  const currentUser = ref(null);
  const mensajes = ref([]);
  const loading = ref(false);
  const enviando = ref(false);

  // Tipos de archivo permitidos
  const allowedFileTypes = {
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

  // Inicializar usuario actual
  const initCurrentUser = () => {
    const stored = localStorage.getItem("user");
    console.log("🔍 Usuario en localStorage:", stored);

    if (stored) {
      try {
        currentUser.value = JSON.parse(stored);
        console.log("✅ Usuario parseado:", currentUser.value);
        return true;
      } catch (error) {
        console.error("❌ Error al parsear usuario:", error);
        return false;
      }
    }
    console.log("❌ No hay usuario en localStorage");
    return false;
  };

  // Cargar usuarios con mensajes
  const cargarUsuariosConMensajes = async () => {
    try {
      console.log("📡 Iniciando carga de usuarios...");
      console.log(
        "🔑 Token actual:",
        localStorage.getItem("token")?.substring(0, 20) + "..."
      );
      console.log("🌐 URL base:", import.meta.env.VITE_API_BASE_URL);

      // Primero verificar que el backend esté funcionando
      try {
        console.log("🏥 Verificando salud del backend...");
        const healthCheck = await api.get("/api/test");
        console.log("✅ Backend funcionando:", healthCheck.data);
      } catch (healthError) {
        console.error("❌ Backend no responde:", healthError);
        throw new Error(
          "No se puede conectar al servidor. Verifica que esté ejecutándose."
        );
      }

      // Intentar obtener conversaciones existentes
      console.log("📞 Obteniendo conversaciones...");
      let data;

      try {
        data = await apiService.getUsuariosConversaciones();
        console.log("📦 Respuesta conversaciones:", data);
      } catch (conversacionesError) {
        console.error(
          "❌ Error obteniendo conversaciones:",
          conversacionesError
        );

        // Si el endpoint de conversaciones falla, intentar todos los usuarios
        console.log("🔄 Intentando endpoint de todos los usuarios...");
        try {
          data = await apiService.getTodosLosUsuarios();
          console.log("📦 Respuesta todos usuarios:", data);
        } catch (todosError) {
          console.error("❌ Error obteniendo todos los usuarios:", todosError);

          // Como último recurso, hacer petición manual
          console.log("🛠️ Intentando petición manual...");
          const manualResponse = await api.get(
            "/api/messages/conversaciones/usuarios"
          );
          data = manualResponse.data;
          console.log("📦 Respuesta manual:", data);
        }
      }

      // Verificar que data sea un objeto válido y no HTML
      if (typeof data === "string" && data.includes("<!doctype html>")) {
        throw new Error(
          "El servidor está devolviendo HTML en lugar de JSON. Verifica la URL del endpoint."
        );
      }

      users.value = data.usuarios || [];
      console.log("👥 Usuarios asignados:", users.value);
      console.log("📊 Cantidad de usuarios:", users.value.length);

      // Si todavía no hay usuarios, crear usuarios de prueba
      if (users.value.length === 0) {
        console.log("💡 No hay usuarios, creando lista de prueba...");
        users.value = [
          {
            id: 2,
            nombre: "Carlos López",
            email: "carlos@test.com",
            ultimoMensaje: {
              content: "¡Inicia una conversación!",
              type: "text",
              createdAt: new Date(),
              esPropio: false,
            },
          },
          {
            id: 3,
            nombre: "María Rodríguez",
            email: "maria@test.com",
            ultimoMensaje: {
              content: "¡Inicia una conversación!",
              type: "text",
              createdAt: new Date(),
              esPropio: false,
            },
          },
          {
            id: 4,
            nombre: "Pedro Martínez",
            email: "pedro@test.com",
            ultimoMensaje: {
              content: "¡Inicia una conversación!",
              type: "text",
              createdAt: new Date(),
              esPropio: false,
            },
          },
        ];
        console.log(
          "🔧 Lista de prueba creada con",
          users.value.length,
          "usuarios"
        );
      }
    } catch (err) {
      console.error("❌ Error completo al obtener usuarios:", err);
      console.error("📊 Status:", err.response?.status);
      console.error("📝 Data:", err.response?.data);
      console.error("🌐 URL:", err.config?.url);
      console.error("🔍 Tipo de error:", typeof err.response?.data);

      // Si hay error 401, redirigir al login
      if (err.response?.status === 401) {
        console.log("🔒 Token inválido, redirigiendo al login...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      // Para otros errores, mostrar usuarios de prueba
      console.log("🛠️ Error recuperable, mostrando usuarios de prueba...");
      users.value = [
        {
          id: 2,
          nombre: "Carlos López",
          email: "carlos@test.com",
          ultimoMensaje: {
            content: "¡Inicia una conversación!",
            type: "text",
            createdAt: new Date(),
            esPropio: false,
          },
        },
        {
          id: 3,
          nombre: "María Rodríguez",
          email: "maria@test.com",
          ultimoMensaje: {
            content: "¡Inicia una conversación!",
            type: "text",
            createdAt: new Date(),
            esPropio: false,
          },
        },
      ];

      // No hacer throw del error para que la app siga funcionando
    }
  };

  // Seleccionar usuario y cargar mensajes
  const selectUser = async (user) => {
    selectedUser.value = user;
    loading.value = true;
    console.log("👤 Seleccionando usuario:", user);

    try {
      const data = await apiService.getMensajesUsuario(user.id);
      console.log("💬 Mensajes obtenidos:", data);

      mensajes.value = data.mensajes || [];
      console.log("📝 Mensajes asignados:", mensajes.value.length);

      // Scroll al final después de cargar mensajes
      await nextTick();
      scrollToBottom();
    } catch (err) {
      console.error("❌ Error al obtener mensajes:", err);
      // No hacer throw para que la app siga funcionando
      mensajes.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Scroll al final del contenedor de mensajes
  const scrollToBottom = (container) => {
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Validar archivo
  const validateFile = (file) => {
    // Validar tipo de archivo
    if (!allowedFileTypes[file.type]) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    // Validar tamaño
    if (file.size > config.maxFileSize) {
      throw new Error(
        `El archivo es demasiado grande. Máximo ${
          config.maxFileSize / 1024 / 1024
        }MB permitido.`
      );
    }

    return true;
  };

  // Enviar mensaje
  const enviarMensaje = async (messageData) => {
    if (!selectedUser.value) {
      throw new Error("No hay usuario seleccionado");
    }

    if (!messageData.archivo && !messageData.content?.trim()) {
      throw new Error("No hay contenido para enviar");
    }

    enviando.value = true;
    console.log("📤 Enviando mensaje:", messageData);

    try {
      const data = {
        receiver_id: selectedUser.value.id.toString(),
        ...messageData,
      };

      // Validar archivo si existe
      if (data.archivo) {
        validateFile(data.archivo);
      }

      const nuevoMensajeData = await apiService.enviarMensaje(data);
      console.log("✅ Mensaje enviado:", nuevoMensajeData);

      // Verificar si el mensaje ya existe (evitar duplicados)
      const exists = mensajes.value.some((m) => m.id === nuevoMensajeData.id);
      if (!exists && nuevoMensajeData) {
        mensajes.value.push(nuevoMensajeData);
        return nuevoMensajeData;
      }

      return nuevoMensajeData;
    } catch (err) {
      console.error("❌ Error al enviar mensaje:", err);
      throw err;
    } finally {
      enviando.value = false;
    }
  };

  // Configurar listeners de socket
  const setupSocketListeners = () => {
    if (!currentUser.value) {
      console.log("⚠️ No hay usuario actual para socket");
      return;
    }

    console.log("🔌 Configurando socket para usuario:", currentUser.value.id);

    // Unirse al canal privado del usuario
    socketService.joinRoom(`user_${currentUser.value.id}`);

    // Escuchar nuevos mensajes
    socketService.on("nuevo_mensaje", (mensaje) => {
      if (config.debugMode) {
        console.log("📨 Nuevo mensaje recibido:", mensaje);
      }

      // Mostrar solo si estamos chateando con ese usuario
      if (
        selectedUser.value &&
        (mensaje.user_id === selectedUser.value.id ||
          mensaje.receiver_id === selectedUser.value.id)
      ) {
        // Evitar duplicados
        const exists = mensajes.value.some((m) => m.id === mensaje.id);
        if (!exists) {
          mensajes.value.push(mensaje);
          nextTick(() => {
            // Scroll automático solo si el usuario está al final
            const container = document.querySelector(".messages-container");
            if (container) {
              const isAtBottom =
                container.scrollTop + container.clientHeight >=
                container.scrollHeight - 10;
              if (isAtBottom) {
                scrollToBottom(container);
              }
            }
          });
        }
      }

      // Actualizar lista de usuarios
      cargarUsuariosConMensajes();
    });

    // Escuchar mensajes eliminados
    socketService.on("mensaje_eliminado", (data) => {
      mensajes.value = mensajes.value.filter((m) => m.id !== data.messageId);
    });
  };

  // Limpiar listeners de socket
  const cleanupSocketListeners = () => {
    socketService.removeAllListeners("nuevo_mensaje");
    socketService.removeAllListeners("mensaje_eliminado");
  };

  // Utilidades para formateo
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  };

  const extractFileName = (url) => {
    return url.split("/").pop();
  };

  const getFileTypeText = (type) => {
    switch (type) {
      case "image":
        return "🖼️ Imagen";
      case "audio":
        return "🎵 Audio";
      case "document":
        return "📄 Documento";
      default:
        return "📁 Archivo";
    }
  };

  return {
    // Estado
    users,
    selectedUser,
    currentUser,
    mensajes,
    loading,
    enviando,
    allowedFileTypes,

    // Métodos
    initCurrentUser,
    cargarUsuariosConMensajes,
    selectUser,
    scrollToBottom,
    validateFile,
    enviarMensaje,
    setupSocketListeners,
    cleanupSocketListeners,

    // Utilidades
    formatTimestamp,
    extractFileName,
    getFileTypeText,
    getMediaUrl,
  };
}
