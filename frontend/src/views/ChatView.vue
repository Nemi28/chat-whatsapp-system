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
          </button>
        </nav>
      </div>

      <!-- Usuario y logout -->
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

    <!-- Panel derecho tipo WhatsApp -->
    <main class="flex-1 flex flex-col relative">
      <!-- Encabezado -->
      <header class="bg-white shadow p-4 border-b">
        <h2 class="text-xl font-semibold text-gray-800">
          {{
            selectedUser
              ? `Chat con ${selectedUser.nombre}`
              : "Selecciona un contacto"
          }}
        </h2>
      </header>

      <!-- Fondo decorativo + mensajes -->
      <section class="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
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
            <p
              v-if="mensaje.type === 'text'"
              class="whitespace-pre-wrap text-sm"
            >
              {{ mensaje.content }}
            </p>

            <div v-else-if="mensaje.type === 'image'">
              <img
                :src="`http://localhost:3000/${mensaje.media_url}`"
                alt="imagen"
                class="rounded-md w-40 shadow"
              />
            </div>

            <div v-else-if="mensaje.type === 'document'">
              📎
              <a
                :href="`http://localhost:3000/${mensaje.media_url}`"
                target="_blank"
                class="text-blue-600 underline"
              >
                Ver documento
              </a>
            </div>

            <div v-else>📁 Mensaje recibido</div>
          </div>
        </div>
        <div v-else class="text-center text-gray-600 mt-10 text-lg">
          📨 Selecciona un contacto para empezar a chatear
        </div>
      </section>

      <!-- Campo de texto -->
      <form
        v-if="selectedUser"
        @submit.prevent="enviarMensaje"
        class="bg-white border-t flex items-center gap-2 px-4 py-3"
      >
        <input
          v-model="nuevoMensaje"
          type="text"
          placeholder="Escribe un mensaje"
          class="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          class="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700"
        >
          Enviar
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const users = ref([
  { id: 2, nombre: "Exson 2" }, // 🔁 temporal mientras no cargamos desde BD
]);
const selectedUser = ref(null);
const currentUser = ref(null);
const mensajes = ref([]);
const nuevoMensaje = ref("");

const selectUser = async (user) => {
  selectedUser.value = user;
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(
      `http://localhost:3000/api/messages/${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    mensajes.value = res.data.mensajes;
  } catch (error) {
    console.error("❌ Error al obtener mensajes:", error);
  }
};

const enviarMensaje = async () => {
  const token = localStorage.getItem("token");
  if (!nuevoMensaje.value.trim()) return;

  try {
    const res = await axios.post(
      "http://localhost:3000/api/messages",
      {
        user_id: selectedUser.value.id,
        type: "text",
        content: nuevoMensaje.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    mensajes.value.push(res.data.data);
    nuevoMensaje.value = "";
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error);
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};

onMounted(() => {
  const stored = localStorage.getItem("user");
  if (stored) {
    currentUser.value = JSON.parse(stored);
  }
});
</script>
