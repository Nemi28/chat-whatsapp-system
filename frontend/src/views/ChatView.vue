<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Menú lateral -->
    <aside class="w-64 bg-white shadow-lg p-4 flex flex-col justify-between">
      <div>
        <h1 class="text-2xl font-bold text-indigo-600 mb-6">💬 Mi Chat</h1>
        <nav class="space-y-2">
          <button
            v-for="user in users"
            :key="user.id"
            @click="selectUser(user)"
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

      <div class="text-sm text-gray-500 mt-6 border-t pt-4">
        <p class="mb-1">
          👤 Sesión:
          <span class="font-medium text-indigo-700">{{
            currentUser?.nombre
          }}</span>
        </p>
        <button @click="logout" class="text-red-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Panel de mensajes -->
    <main class="flex-1 flex flex-col relative">
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
        class="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
        ref="messagesContainer"
      >
        <div v-if="selectedUser" class="space-y-3 max-w-2xl mx-auto">
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

            <p
              v-if="mensaje.type === 'text'"
              class="whitespace-pre-wrap text-sm"
            >
              {{ mensaje.content }}
            </p>

            <div v-else-if="mensaje.type === 'image'">
              <img
                :src="`http://localhost:3000/${mensaje.media_url}`"
                :alt="mensaje.content || 'imagen'"
                class="rounded-md w-40 shadow cursor-pointer"
                @click="openImageModal(mensaje.media_url)"
                @error="handleImageError"
              />
            </div>

            <div v-else-if="mensaje.type === 'document'">
              📎
              <a
                :href="`http://localhost:3000/${mensaje.media_url}`"
                target="_blank"
                class="text-blue-600 underline hover:text-blue-800"
                download
              >
                {{ mensaje.content || extractFileName(mensaje.media_url) }}
              </a>
            </div>

            <div v-else-if="mensaje.type === 'audio'">
              🎧
              <audio
                controls
                :src="`http://localhost:3000/${mensaje.media_url}`"
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

          <!-- Indicador de carga -->
          <div v-if="loading" class="text-center py-4">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
          </div>
        </div>
        <div v-else class="text-center text-gray-600 mt-10 text-lg">
          📨 Selecciona un contacto para empezar a chatear
        </div>
      </section>

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
            @click="detenerGrabacion"
            class="bg-red-500 text-white px-4 py-1 rounded"
          >
            Detener y Previsualizar
          </button>
          <button
            @click="cancelarGrabacion"
            class="ml-2 text-gray-500 underline"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Campo de mensaje -->
      <form
        v-if="selectedUser"
        @submit.prevent="enviar"
        class="bg-white border-t flex items-center gap-2 px-4 py-3"
      >
        <input
          v-model="nuevoMensaje"
          type="text"
          placeholder="Escribe un mensaje"
          class="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          :disabled="enviando"
        />

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
          class="p-2 hover:bg-gray-100 rounded"
        >
          📎
        </button>
        <button
          type="button"
          @click="grabarAudio"
          :disabled="enviando"
          class="p-2 hover:bg-gray-100 rounded"
        >
          🎙️
        </button>

        <button
          type="submit"
          :disabled="enviando || (!nuevoMensaje.trim() && !archivoFinal)"
          class="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        :src="`http://localhost:3000/${imageModal}`"
        alt="Imagen ampliada"
        class="max-w-full max-h-full object-contain"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
const router = useRouter();
const users = ref([]);
const selectedUser = ref(null);
const currentUser = ref(null);
const mensajes = ref([]);
const nuevoMensaje = ref("");
const archivoInput = ref(null);
const archivoPreview = ref(null);
const archivoFinal = ref(null);
const grabando = ref(false);
const enviando = ref(false);
const loading = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const waveformCanvas = ref(null);
const audioContext = ref(null);
const animationId = ref(null);
const messagesContainer = ref(null);
const imageModal = ref(null);

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

const maxFileSize = 10 * 1024 * 1024; // 10MB

const cargarUsuariosConMensajes = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const res = await axios.get(
      "http://localhost:3000/api/messages/conversaciones/usuarios",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Compatibilidad con ambos formatos de respuesta
    if (res.data.success) {
      users.value = res.data.data.usuarios || [];
    } else {
      users.value = res.data.usuarios || [];
    }
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    if (err.response?.status === 401) {
      logout();
    }
  }
};

const selectUser = async (user) => {
  selectedUser.value = user;
  loading.value = true;

  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(
      `http://localhost:3000/api/messages/${user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Compatibilidad con ambos formatos de respuesta
    if (res.data.success) {
      mensajes.value = res.data.data.mensajes || [];
    } else {
      mensajes.value = res.data.mensajes || [];
    }

    // Scroll al final después de cargar mensajes
    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err);
    if (err.response?.status === 401) {
      logout();
    }
  } finally {
    loading.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
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

const validateFile = (file) => {
  // Validar tipo de archivo
  if (!allowedFileTypes[file.type]) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }

  // Validar tamaño
  if (file.size > maxFileSize) {
    throw new Error(`El archivo es demasiado grande. Máximo 10MB permitido.`);
  }

  return true;
};

const handleArchivo = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    validateFile(file);
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
    alert(error.message);
    e.target.value = ""; // Limpiar input
  }
};

const cancelarArchivo = () => {
  archivoPreview.value = null;
  archivoFinal.value = null;
  if (archivoInput.value) {
    archivoInput.value.value = "";
  }
};

const grabarAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (e) => {
      audioChunks.value.push(e.data);
    };

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(audioChunks.value, { type: "audio/webm" });
      const file = new File([blob], "grabacion.webm", { type: "audio/webm" });
      archivoFinal.value = file;
      archivoPreview.value = {
        type: "audio",
        url: URL.createObjectURL(blob),
        name: "grabacion.webm",
      };
      grabando.value = false;

      // Limpiar recursos de audio
      if (audioContext.value) {
        audioContext.value.close();
        audioContext.value = null;
      }
      if (animationId.value) {
        cancelAnimationFrame(animationId.value);
        animationId.value = null;
      }

      // Detener todas las pistas del stream
      stream.getTracks().forEach((track) => track.stop());
    };

    grabando.value = true;
    mediaRecorder.value.start();

    // Esperar a que el DOM se actualice antes de renderizar
    await nextTick();
    renderWaveform(stream);
  } catch (error) {
    console.error("❌ Error al grabar audio:", error);
    alert("Error al acceder al micrófono. Verifica los permisos.");
    grabando.value = false;
  }
};

const detenerGrabacion = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
    mediaRecorder.value.stop();
  }
};

const cancelarGrabacion = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
    mediaRecorder.value.stop();
  }

  grabando.value = false;
  archivoPreview.value = null;
  archivoFinal.value = null;

  // Limpiar recursos
  if (audioContext.value) {
    audioContext.value.close();
    audioContext.value = null;
  }
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }
};

const renderWaveform = (stream) => {
  if (!waveformCanvas.value) {
    console.error("❌ Canvas no encontrado");
    return;
  }

  try {
    audioContext.value = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.value.createMediaStreamSource(stream);
    const analyser = audioContext.value.createAnalyser();
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = waveformCanvas.value;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const draw = () => {
      if (!grabando.value) return;

      animationId.value = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = "#6366F1";

      const barWidth = canvas.width / 2 / bufferLength;

      dataArray.forEach((val, i) => {
        const barHeight = (val / 255) * (canvas.height / 4);
        ctx.fillRect(
          i * barWidth,
          canvas.height / 4 - barHeight,
          barWidth - 1,
          barHeight
        );
      });
    };

    draw();
  } catch (error) {
    console.error("❌ Error al inicializar waveform:", error);
  }
};

const enviar = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ No hay token de autenticación");
    router.push("/login");
    return;
  }

  if (!selectedUser.value) {
    console.error("❌ No hay usuario seleccionado");
    return;
  }

  // Validar que hay contenido para enviar
  if (!archivoFinal.value && !nuevoMensaje.value.trim()) {
    console.log("⚠️ No hay contenido para enviar");
    return;
  }

  enviando.value = true;

  try {
    const formData = new FormData();
    formData.append("receiver_id", selectedUser.value.id.toString());

    if (archivoFinal.value) {
      // Validar archivo antes de enviar
      validateFile(archivoFinal.value);
      formData.append("archivo", archivoFinal.value);
      console.log("📎 Enviando archivo:", {
        name: archivoFinal.value.name,
        type: archivoFinal.value.type,
        size: archivoFinal.value.size,
      });
    } else if (nuevoMensaje.value.trim()) {
      formData.append("type", "text");
      formData.append("content", nuevoMensaje.value.trim());
      console.log("📝 Enviando texto:", nuevoMensaje.value);
    }

    const res = await axios.post(
      "http://localhost:3000/api/messages",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      }
    );

    console.log("✅ Respuesta del servidor:", res.data);

    // Compatibilidad con ambos formatos de respuesta
    let nuevoMensajeData;
    if (res.data.success) {
      nuevoMensajeData = res.data.data;
    } else {
      nuevoMensajeData = res.data.data;
    }

    if (nuevoMensajeData) {
      // Verificar si el mensaje ya existe (evitar duplicados)
      const exists = mensajes.value.some((m) => m.id === nuevoMensajeData.id);
      if (!exists) {
        mensajes.value.push(nuevoMensajeData);
        await nextTick();
        scrollToBottom();
      }

      // Limpiar formulario
      nuevoMensaje.value = "";
      cancelarArchivo();

      console.log("✅ Mensaje enviado correctamente");
    } else {
      console.warn("⚠️ Respuesta inesperada del servidor:", res.data);
    }
  } catch (err) {
    console.error("❌ Error al enviar mensaje:", err);

    let errorMessage = "Error al enviar mensaje";

    if (err.response) {
      console.error("📊 Status:", err.response.status);
      console.error("💬 Data:", err.response.data);

      if (err.response.status === 401) {
        logout();
        return;
      }

      errorMessage = err.response.data?.message || errorMessage;
    } else if (err.request) {
      errorMessage = "Error de conexión";
    } else if (err.message) {
      errorMessage = err.message;
    }

    alert(errorMessage);
  } finally {
    enviando.value = false;
  }
};

const handleImageError = (event) => {
  console.error("Error al cargar imagen:", event.target.src);
  event.target.style.display = "none";
};

const handleAudioError = (event) => {
  console.error("Error al cargar audio:", event.target.src);
};

const openImageModal = (imageUrl) => {
  imageModal.value = imageUrl;
};

const closeImageModal = () => {
  imageModal.value = null;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};

onMounted(() => {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored);
      cargarUsuariosConMensajes();

      // Unirse a su canal privado
      socket.emit("join", `user_${currentUser.value.id}`);

      // Escuchar nuevos mensajes
      socket.on("nuevo_mensaje", (mensaje) => {
        console.log("📨 Nuevo mensaje recibido:", mensaje);

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
            nextTick(() => scrollToBottom());
          }
        }

        // Actualizar lista de usuarios si es necesario
        cargarUsuariosConMensajes();
      });

      // Escuchar mensajes eliminados
      socket.on("mensaje_eliminado", (data) => {
        mensajes.value = mensajes.value.filter((m) => m.id !== data.messageId);
      });
    } catch (error) {
      console.error("Error al parsear usuario:", error);
      logout();
    }
  } else {
    router.push("/login");
  }
});

onUnmounted(() => {
  socket.off("nuevo_mensaje");
  socket.off("mensaje_eliminado");

  // Limpiar recursos de audio
  if (audioContext.value) {
    audioContext.value.close();
  }
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
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
</style>
