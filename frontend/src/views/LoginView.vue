<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 px-4"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <h2 class="text-3xl font-extrabold text-center text-indigo-600 mb-6">
        Bienvenido 👋
      </h2>
      <p class="text-gray-500 text-center mb-8">
        Ingresa con tu cuenta para comenzar
      </p>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-gray-700 mb-1">📧 Correo</label>
          <input
            type="email"
            v-model="email"
            required
            placeholder="tucorreo@correo.com"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1">🔒 Contraseña</label>
          <input
            type="password"
            v-model="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  </div>
  <p v-if="error" class="text-red-500 text-sm mt-4 text-center">{{ error }}</p>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  error.value = "";
  loading.value = true;

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    // Guardar token y datos del usuario
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.usuario));

    alert("✅ Login exitoso");
    router.push("/chat");
    // Redirigir a la pantalla principal (la configuraremos después)
    // Ejemplo: router.push('/chat')
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
