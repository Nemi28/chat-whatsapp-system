<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Menú lateral -->
    <aside class="w-64 bg-white shadow-lg p-4 flex flex-col justify-between">
      <div>
        <h1 class="text-2xl font-bold text-indigo-600 mb-6">
          💬 {{ config.appTitle || "Mi Chat" }}
        </h1>

        <!-- Loading de usuarios -->
        <div v-if="loadingUsers" class="text-center py-4">
          <div
            class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"
          ></div>
          <p class="text-sm text-gray-500 mt-2">Cargando chats...</p>
        </div>

        <!-- Lista de usuarios -->
        <nav v-else class="space-y-2">
          <div v-if="users.length === 0" class="text-center py-4 text-gray-500">
            No hay conversaciones aún
          </div>

          <button
            v-for="user in users"
            :key="user.id"
            @click="handleSelectUser(user)"
            :class="[
              'w-full text-left px-4 py-2 rounded transition',
              selectedUser?.id === user.id
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'hover:bg-gray-100 text-gray-800',
            ]"
          >
            {{ user.nombre }}
            <!-- Mostrar último mensaje si existe -->
            <div
              v-if="user.ultimoMensaje"
              class="text-xs text-gray-500 truncate"
            >
              {{ user.ultimoMensaje.esPropio ? "Tú: " : "" }}
              {{
                user.ultimoMensaje.content ||
                getFileTypeText(user.ultimoMensaje.type)
              }}
            </div>
          </button>
        </nav>
      </div>

      <!-- Info del usuario actual -->
      <div class="text-sm text-gray-500 mt-6 border-t pt-4">
        <p class="mb-1">
          👤 Sesión:
          <span class="font-medium text-indigo-700">{{
            currentUser?.nombre || "Usuario"
          }}</span>
        </p>
        <button @click="handleLogout" class="text-red-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Panel de mensajes -->
    <main class="flex-1 flex flex-col relative">
      <!-- Header del chat -->
      <header class="bg-white shadow p-4 border-b">
        <h2 class="text-xl font-semibold text-gray-800">
          {{
            selectedUser
              ? `Chat con ${selectedUser.nombre}`
              : "Selecciona un contacto"
          }}
        </h2>
      </header>

      <!-- Lista de mensajes -->
      <section
        class="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 messages-container"
        ref="messagesContainer"
        @scroll="handleScroll"
      >
        <div v-if="selectedUser" class="space-y-3 max-w-2xl mx-auto">
          <!-- Mensajes -->
          <div
            v-for="mensaje in mensajes"
            :key="mensaje.id"
            :class="[
              'max-w-[75%] px-4 py-2 rounded-lg shadow',
              mensaje.user_id === currentUser?.id
                ? 'bg-green-200 text-right self-end ml-auto'
                : 'bg-white text-left self-start mr-auto',
            ]"
          >
            <!-- Nombre del remitente si no es mensaje propio -->
            <div
              v-if="mensaje.user_id !== currentUser?.id && mensaje.sender"
              class="text-xs text-gray-600 mb-1"
            >
              {{ mensaje.sender.nombre }}
            </div>

            <!-- Contenido del mensaje -->
            <p
              v-if="mensaje.type === 'text'"
              class="whitespace-pre-wrap text-sm"
            >
              {{ mensaje.content }}
            </p>

            <!-- Imagen -->
            <div v-else-if="mensaje.type === 'image'">
              <img
                :src="getMediaUrl(mensaje.media_url)"
                :alt="mensaje.content || 'imagen'"
                class="rounded-md w-40 shadow cursor-pointer"
                @click="openImageModal(mensaje.media_url)"
                @error="handleImageError"
              />
            </div>

            <!-- Documento -->
            <div v-else-if="mensaje.type === 'document'">
              📎
              <a
                :href="getMediaUrl(mensaje.media_url)"
                target="_blank"
                class="text-blue-600 underline hover:text-blue-800"
                download
              >
                {{ mensaje.content || extractFileName(mensaje.media_url) }}
              </a>
            </div>

            <!-- Audio -->
            <div v-else-if="mensaje.type === 'audio'">
              🎧
              <audio
                controls
                :src="getMediaUrl(mensaje.media_url)"
                class="max-w-full"
                @error="handleAudioError"
              />
            </div>

            <div v-else>📁 Contenido no reconocido</div>

            <!-- Timestamp -->
            <div class="text-xs text-gray-500 mt-1">
              {{ formatTimestamp(mensaje.createdAt) }}
            </div>
          </div>

          <!-- Indicador de carga de mensajes -->
          <div v-if="loading" class="text-center py-4">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="text-sm text-gray-500 mt-2">Cargando mensajes...</p>
          </div>
        </div>

        <!-- Mensaje de bienvenida -->
        <div v-else class="text-center text-gray-600 mt-10 text-lg">
          📨 Selecciona un contacto para empezar a chatear
        </div>
      </section>

      <!-- Mostrar errores de validación -->
      <div
        v-if="validationErrors.length > 0"
        class="bg-red-50 border-l-4 border-red-400 p-4 m-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Errores de validación
            </h3>
            <div class="mt-2 text-sm text-red-700">
              <ul class="list-disc list-inside space-y-1">
                <li v-for="error in validationErrors" :key="error">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="clearValidationErrors"
              class="text-red-400 hover:text-red-600"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Previsualización antes de enviar -->
      <div
        v-if="archivoPreview"
        class="bg-yellow-50 p-4 border-t flex items-center gap-4"
      >
        <div v-if="archivoPreview.type === 'image'">
          <img :src="archivoPreview.url" alt="Preview" class="w-24 rounded" />
        </div>
        <div v-else-if="archivoPreview.type === 'document'">
          📄 Archivo listo para enviar: {{ archivoPreview.name }}
        </div>
        <div v-else-if="archivoPreview.type === 'audio'">
          🎤 Grabación lista:
          <audio :src="archivoPreview.url" controls class="ml-2" />
        </div>

        <!-- Mostrar información del archivo validado -->
        <div class="flex-1 text-sm text-gray-600">
          <div v-if="fileValidationInfo">
            <span class="text-green-600">✅ Archivo válido</span>
            <div class="text-xs">
              Tamaño: {{ fileValidationInfo.sizeFormatted }} | Tipo:
              {{ fileValidationInfo.type }}
            </div>
          </div>
        </div>

        <button @click="cancelarArchivo" class="text-red-500 hover:underline">
          Cancelar
        </button>
      </div>

      <!-- Grabación activa -->
      <div
        v-if="grabando"
        class="bg-red-100 text-red-800 px-4 py-2 text-center"
      >
        🔴 Grabando... <span class="animate-pulse">🎙️</span>
        <canvas
          ref="waveformCanvas"
          class="w-full h-12 mt-2"
          width="800"
          height="48"
        >
        </canvas>
        <div class="mt-2">
          <button
            @click="handleDetenerGrabacion"
            class="bg-red-500 text-white px-4 py-1 rounded"
          >
            Detener y Previsualizar
          </button>
          <button
            @click="handleCancelarGrabacion"
            class="ml-2 text-gray-500 underline"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Campo de mensaje con validaciones -->
      <form
        v-if="selectedUser"
        @submit.prevent="handleEnviar"
        class="bg-white border-t flex items-center gap-2 px-4 py-3"
      >
        <div class="flex-1 relative">
          <input
            v-model="nuevoMensaje"
            type="text"
            placeholder="Escribe un mensaje"
            :class="[
              'w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 transition duration-200',
              messageValidationError
                ? 'border-red-300 focus:ring-red-400 bg-red-50'
                : 'border-gray-300 focus:ring-indigo-300',
            ]"
            :disabled="enviando"
            @input="validateMessage"
            @blur="validateMessage"
            :maxlength="1000"
          />
          <!-- Contador de caracteres -->
          <div
            v-if="nuevoMensaje.length > 800"
            :class="[
              'absolute right-3 top-1/2 transform -translate-y-1/2 text-xs',
              nuevoMensaje.length > 1000 ? 'text-red-500' : 'text-orange-500',
            ]"
          >
            {{ 1000 - nuevoMensaje.length }}
          </div>

          <!-- Error de mensaje -->
          <div
            v-if="messageValidationError"
            class="absolute left-4 -bottom-6 text-xs text-red-500"
          >
            {{ messageValidationError }}
          </div>
        </div>

        <input
          type="file"
          ref="archivoInput"
          @change="handleArchivo"
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          class="hidden"
        />
        <button
          type="button"
          @click="$refs.archivoInput.click()"
          :disabled="enviando"
          class="p-2 hover:bg-gray-100 rounded transition duration-200"
          title="Adjuntar archivo"
        >
          📎
        </button>
        <button
          type="button"
          @click="handleGrabarAudio"
          :disabled="enviando"
          class="p-2 hover:bg-gray-100 rounded transition duration-200"
          title="Grabar audio"
        >
          🎙️
        </button>

        <button
          type="submit"
          :disabled="enviando || !isMessageValid"
          :class="[
            'px-4 py-2 rounded-full transition duration-200',
            enviando || !isMessageValid
              ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700',
          ]"
        >
          {{ enviando ? "Enviando..." : "Enviar" }}
        </button>
      </form>
    </main>

    <!-- Modal para mostrar imágenes -->
    <div
      v-if="imageModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="closeImageModal"
    >
      <img
        :src="getMediaUrl(imageModal)"
        alt="Imagen ampliada"
        class="max-w-full max-h-full object-contain"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useChat } from "@/composables/useChat.js";
import { useAudio } from "@/composables/useAudio.js";
import socketService from "@/services/socket.js";
import { config } from "@/services/api.js";

const router = useRouter();

// ============================================
// VALIDACIONES INLINE (para no crear archivo separado)
// ============================================
const validateMessage = (content, hasFile = false) => {
  const errors = [];

  // Si no hay archivo, el contenido es obligatorio
  if (!hasFile && (!content || content.trim().length === 0)) {
    errors.push("Debe escribir un mensaje o adjuntar un archivo");
    return { isValid: false, errors };
  }

  // Si hay contenido, validar longitud
  if (content && content.trim().length > 1000) {
    errors.push("El mensaje no puede exceder 1000 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: content ? sanitizeText(content.trim()) : null,
  };
};

const validateFile = (file) => {
  const errors = [];

  if (!file) {
    return { isValid: true, errors: [] }; // Archivo opcional
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push(`El archivo es demasiado grande. Máximo permitido: 50MB`);
  }

  const allowedTypes = [
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

  if (!allowedTypes.includes(file.type)) {
    errors.push(
      "Tipo de archivo no permitido. Solo se permiten imágenes, audio y documentos."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: formatFileSize(file.size),
    },
  };
};

const sanitizeText = (text) => {
  if (!text) return "";

  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remover scripts
    .replace(/<[^>]*>/g, "") // Remover tags HTML
    .replace(/javascript:/gi, "") // Remover javascript:
    .replace(/on\w+\s*=/gi, "") // Remover event handlers
    .trim();
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Composables
const {
  users,
  selectedUser,
  currentUser,
  mensajes,
  loading,
  enviando,
  allowedFileTypes,
  initCurrentUser,
  cargarUsuariosConMensajes,
  selectUser,
  scrollToBottom,
  validateFile: originalValidateFile,
  enviarMensaje,
  setupSocketListeners,
  cleanupSocketListeners,
  formatTimestamp,
  extractFileName,
  getFileTypeText,
  getMediaUrl,
} = useChat();

const {
  grabando,
  iniciarGrabacion,
  detenerGrabacion,
  cancelarGrabacion,
  renderWaveform,
  cleanup: cleanupAudio,
  checkAudioSupport,
} = useAudio();

// Referencias locales
const nuevoMensaje = ref("");
const archivoInput = ref(null);
const archivoPreview = ref(null);
const archivoFinal = ref(null);
const messagesContainer = ref(null);
const waveformCanvas = ref(null);
const imageModal = ref(null);
const currentStream = ref(null);
const loadingUsers = ref(true);

// ============================================
// ESTADO DE VALIDACIONES
// ============================================
const validationErrors = ref([]);
const messageValidationError = ref("");
const fileValidationInfo = ref(null);

// ============================================
// WATCHERS PARA AUTO-SCROLL
// ============================================
// Watcher para hacer scroll automático cuando cambien los mensajes
watch(
  () => mensajes.value,
  (newMensajes, oldMensajes) => {
    // Solo hacer scroll si hay mensajes y ha cambiado la lista
    if (newMensajes && newMensajes.length > 0 && selectedUser.value) {
      nextTick(() => {
        setTimeout(() => {
          scrollToBottomInstant(messagesContainer.value);
          console.log("📜 Auto-scroll por cambio en mensajes");
        }, 50);
      });
    }
  },
  { deep: true }
);

// Watcher para hacer scroll cuando se selecciona un usuario diferente
watch(
  () => selectedUser.value,
  (newUser, oldUser) => {
    if (newUser && newUser.id !== oldUser?.id) {
      console.log("👤 Usuario cambiado, preparando scroll...");
      nextTick(() => {
        setTimeout(() => {
          scrollToBottomInstant(messagesContainer.value);
          console.log("📜 Auto-scroll por cambio de usuario");
        }, 100);

        // Scroll adicional para asegurar
        setTimeout(() => {
          scrollToBottomSmooth(messagesContainer.value);
        }, 400);
      });
    }
  }
);

// ============================================
// COMPUTED PROPERTIES
// ============================================
const isMessageValid = computed(() => {
  const hasValidMessage =
    nuevoMensaje.value.trim().length > 0 && !messageValidationError.value;
  const hasValidFile = !!archivoFinal.value;

  return hasValidMessage || hasValidFile;
});

// ============================================
// MÉTODOS DE VALIDACIÓN
// ============================================
const validateMessageInput = () => {
  const validation = validateMessage(nuevoMensaje.value, !!archivoFinal.value);

  if (!validation.isValid) {
    messageValidationError.value = validation.errors[0];
  } else {
    messageValidationError.value = "";
  }

  return validation;
};

const clearValidationErrors = () => {
  validationErrors.value = [];
  messageValidationError.value = "";
};

// ============================================
// MÉTODOS DE SCROLL MEJORADOS
// ============================================
const scrollToBottomSmooth = (container) => {
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });
};

const scrollToBottomInstant = (container) => {
  if (!container) return;

  container.scrollTop = container.scrollHeight;
};

const handleScroll = () => {
  // Opcional: detectar si el usuario está cerca del final
  const container = messagesContainer.value;
  if (!container) return;

  const isNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  // Puedes usar esta información para mostrar un botón "ir abajo" si el usuario está arriba
};

// Manejo de selección de usuario
const handleSelectUser = async (user) => {
  try {
    console.log("👤 Seleccionando usuario:", user.nombre);
    clearValidationErrors(); // Limpiar errores al cambiar usuario

    // Primero seleccionar el usuario (esto carga los mensajes)
    await selectUser(user);

    // Múltiples intentos de scroll para asegurar que funcione
    await nextTick(); // Esperar actualización del DOM

    setTimeout(() => {
      scrollToBottomInstant(messagesContainer.value);
      console.log("📜 Scroll inmediato a los últimos mensajes");
    }, 50);

    setTimeout(() => {
      scrollToBottomSmooth(messagesContainer.value);
      console.log("📜 Scroll suave de confirmación");
    }, 300);
  } catch (error) {
    console.error("Error al seleccionar usuario:", error);
    if (error.response?.status === 401) {
      handleLogout();
    }
  }
};

// Manejo de archivos con validación
const handleArchivo = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const validation = validateFile(file);

    if (!validation.isValid) {
      validationErrors.value = validation.errors;
      e.target.value = "";
      return;
    }

    // Limpiar errores anteriores
    clearValidationErrors();

    // Guardar información de validación
    fileValidationInfo.value = validation.fileInfo;
    archivoFinal.value = file;

    const fileType = allowedFileTypes[file.type];

    if (fileType === "image") {
      archivoPreview.value = {
        type: "image",
        url: URL.createObjectURL(file),
        name: file.name,
      };
    } else if (fileType === "audio") {
      archivoPreview.value = {
        type: "audio",
        url: URL.createObjectURL(file),
        name: file.name,
      };
    } else {
      archivoPreview.value = {
        type: "document",
        name: file.name,
      };
    }
  } catch (error) {
    validationErrors.value = [error.message];
    e.target.value = "";
  }
};

const cancelarArchivo = () => {
  archivoPreview.value = null;
  archivoFinal.value = null;
  fileValidationInfo.value = null;
  clearValidationErrors();

  if (archivoInput.value) {
    archivoInput.value.value = "";
  }
};

// Manejo de grabación de audio
const handleGrabarAudio = async () => {
  if (!checkAudioSupport()) {
    validationErrors.value = ["Tu navegador no soporta grabación de audio"];
    return;
  }

  try {
    clearValidationErrors();
    const result = await iniciarGrabacion();
    if (result.success) {
      currentStream.value = result.stream;
      await renderWaveform(result.stream, waveformCanvas);
    }
  } catch (error) {
    validationErrors.value = [error.message];
  }
};

const handleDetenerGrabacion = async () => {
  try {
    const result = await detenerGrabacion();
    if (result) {
      archivoFinal.value = result.file;
      archivoPreview.value = {
        type: "audio",
        url: result.url,
        name: result.name,
      };

      // Validar el archivo de audio generado
      const validation = validateFile(result.file);
      if (validation.isValid) {
        fileValidationInfo.value = validation.fileInfo;
      }
    }

    // Detener stream
    if (currentStream.value) {
      currentStream.value.getTracks().forEach((track) => track.stop());
      currentStream.value = null;
    }
  } catch (error) {
    console.error("Error al detener grabación:", error);
    validationErrors.value = ["Error al procesar la grabación"];
  }
};

const handleCancelarGrabacion = () => {
  cancelarGrabacion();
  cancelarArchivo();

  // Detener stream
  if (currentStream.value) {
    currentStream.value.getTracks().forEach((track) => track.stop());
    currentStream.value = null;
  }
};

// Manejo de envío de mensajes con validación
const handleEnviar = async () => {
  if (!selectedUser.value) {
    validationErrors.value = ["No hay usuario seleccionado"];
    return;
  }

  // Validar mensaje antes del envío
  const messageValidation = validateMessageInput();

  if (!messageValidation.isValid && !archivoFinal.value) {
    validationErrors.value = messageValidation.errors;
    return;
  }

  try {
    clearValidationErrors();
    const messageData = {};

    if (archivoFinal.value) {
      messageData.archivo = archivoFinal.value;
    } else if (nuevoMensaje.value.trim()) {
      messageData.type = "text";
      messageData.content = messageValidation.sanitized; // Usar contenido sanitizado
    }

    console.log("📤 Enviando mensaje:", messageData);
    await enviarMensaje(messageData);

    // Limpiar formulario
    nuevoMensaje.value = "";
    cancelarArchivo();

    // Scroll al final y actualizar lista de usuarios
    await nextTick();
    scrollToBottom(messagesContainer.value);
    await cargarUsuariosConMensajes();

    console.log("✅ Mensaje enviado correctamente");
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error);

    let errorMessage = "Error al enviar mensaje";
    if (error.response) {
      if (error.response.status === 401) {
        handleLogout();
        return;
      } else if (error.response.status === 400) {
        // Error de validación del servidor
        const serverErrors = error.response.data?.errors || [];
        if (serverErrors.length > 0) {
          validationErrors.value = serverErrors.map((err) => err.message);
        } else {
          validationErrors.value = [
            error.response.data?.message || errorMessage,
          ];
        }
        return;
      }
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    validationErrors.value = [errorMessage];
  }
};

// Manejo de errores de medios
const handleImageError = (event) => {
  console.error("Error al cargar imagen:", event.target.src);
  event.target.style.display = "none";
};

const handleAudioError = (event) => {
  console.error("Error al cargar audio:", event.target.src);
};

// Modal de imágenes
const openImageModal = (imageUrl) => {
  imageModal.value = imageUrl;
};

const closeImageModal = () => {
  imageModal.value = null;
};

// Manejo de logout
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  socketService.disconnect();
  router.push("/login");
};

// Ciclo de vida del componente
onMounted(async () => {
  console.log("🚀 Iniciando ChatView...");

  // Inicializar usuario actual
  if (!initCurrentUser()) {
    console.log("❌ No hay usuario logueado");
    router.push("/login");
    return;
  }

  console.log("✅ Usuario actual:", currentUser.value);

  try {
    // Conectar socket
    socketService.connect();

    // Cargar datos iniciales
    console.log("📡 Cargando usuarios y conversaciones...");
    loadingUsers.value = true;
    await cargarUsuariosConMensajes();
    loadingUsers.value = false;

    console.log("✅ Usuarios cargados:", users.value.length);

    // Configurar listeners de socket
    setupSocketListeners();

    console.log("✅ Chat inicializado correctamente");
  } catch (error) {
    console.error("❌ Error al inicializar chat:", error);
    loadingUsers.value = false;

    if (error.response?.status === 401) {
      handleLogout();
    } else {
      validationErrors.value = [
        "Error al cargar el chat. Intenta recargar la página.",
      ];
    }
  }
});

onUnmounted(() => {
  console.log("🧹 Limpiando ChatView...");

  // Limpiar listeners
  cleanupSocketListeners();

  // Limpiar recursos de audio
  cleanupAudio();

  // Detener stream si existe
  if (currentStream.value) {
    currentStream.value.getTracks().forEach((track) => track.stop());
  }

  // Desconectar socket
  socketService.disconnect();
});
</script>

<style scoped>
canvas {
  background: #fef2f2;
  border-radius: 0.5rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.messages-container {
  scroll-behavior: smooth;
}
</style>
