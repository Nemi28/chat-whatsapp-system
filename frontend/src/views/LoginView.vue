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

      <!-- Mostrar estado de debug -->
      <div v-if="debugInfo" class="mb-4 p-3 bg-gray-100 rounded text-xs">
        <strong>Debug Info:</strong><br />
        <div>{{ debugInfo }}</div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Campo Email con Validaciones -->
        <div>
          <label class="block text-gray-700 mb-1">📧 Correo</label>
          <input
            type="email"
            v-model="email"
            required
            placeholder="tucorreo@correo.com"
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition duration-200',
              validationErrors.email
                ? 'border-red-300 focus:ring-red-400 bg-red-50'
                : 'border-gray-300 focus:ring-indigo-400',
            ]"
            :disabled="loading"
            @blur="validateField('email')"
            @input="clearFieldError('email')"
          />
          <!-- Mostrar errores de email -->
          <div v-if="validationErrors.email" class="mt-1">
            <p
              v-for="errorMsg in validationErrors.email"
              :key="errorMsg"
              class="text-red-500 text-xs"
            >
              {{ errorMsg }}
            </p>
          </div>
        </div>

        <!-- Campo Contraseña con Validaciones -->
        <div>
          <label class="block text-gray-700 mb-1">🔒 Contraseña</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="••••••••"
              :class="[
                'w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:outline-none transition duration-200',
                validationErrors.password
                  ? 'border-red-300 focus:ring-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-indigo-400',
              ]"
              :disabled="loading"
              @blur="validateField('password')"
              @input="clearFieldError('password')"
            />
            <!-- Botón mostrar/ocultar contraseña -->
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabindex="-1"
            >
              <svg
                v-if="!showPassword"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.636 6.636m3.242 3.242l4.242 4.242M6.636 6.636L2.05 2.05m4.586 4.586L9.878 9.878"
                />
              </svg>
            </button>
          </div>
          <!-- Mostrar errores de contraseña -->
          <div v-if="validationErrors.password" class="mt-1">
            <p
              v-for="errorMsg in validationErrors.password"
              :key="errorMsg"
              class="text-red-500 text-xs"
            >
              {{ errorMsg }}
            </p>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading || !isFormValid"
          :class="[
            'w-full py-2 rounded-lg transition duration-200',
            loading || !isFormValid
              ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700',
          ]"
        >
          {{ loading ? "Iniciando sesión..." : "Iniciar Sesión" }}
        </button>
      </form>

      <!-- Mostrar errores del servidor (mantener tu sistema actual) -->
      <p v-if="error" class="text-red-500 text-sm mt-4 text-center">
        ❌ {{ error }}
      </p>

      <!-- Mostrar éxito -->
      <p v-if="success" class="text-green-500 text-sm mt-4 text-center">
        ✅ {{ success }}
      </p>

      <!-- Mostrar errores generales de validación -->
      <div
        v-if="Object.keys(validationErrors).length > 0 && !error"
        class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
      >
        <p class="text-red-600 text-sm font-medium">
          ⚠️ Por favor corrige los errores antes de continuar
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter } from "vue-router";

// ============================================
// UTILIDADES DE VALIDACIÓN (inline para no crear archivo separado)
// ============================================
const validateEmail = (email) => {
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push("El email es obligatorio");
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push("El formato del email no es válido");
  }

  if (email.length > 100) {
    errors.push("El email no puede exceder 100 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: email.trim().toLowerCase(),
  };
};

const validatePassword = (password, isLogin = true) => {
  const errors = [];

  if (!password) {
    errors.push("La contraseña es obligatoria");
    return { isValid: false, errors };
  }

  // Para login, solo verificar que no esté vacía
  if (isLogin) {
    return {
      isValid: password.length > 0,
      errors: password.length === 0 ? ["La contraseña es requerida"] : [],
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
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

// ============================================
// ESTADO DEL COMPONENTE
// ============================================
const email = ref("");
const password = ref("");
const error = ref("");
const success = ref("");
const loading = ref(false);
const debugInfo = ref("");
const showPassword = ref(false);
const validationErrors = reactive({});
const router = useRouter();

// ============================================
// COMPUTED PROPERTIES
// ============================================
const isFormValid = computed(() => {
  const emailValid = email.value.length > 0 && !validationErrors.email;
  const passwordValid = password.value.length > 0 && !validationErrors.password;

  return emailValid && passwordValid;
});

// ============================================
// MÉTODOS DE VALIDACIÓN
// ============================================
const validateField = (fieldName) => {
  switch (fieldName) {
    case "email":
      const emailValidation = validateEmail(email.value);
      if (!emailValidation.isValid) {
        validationErrors.email = emailValidation.errors;
      } else {
        delete validationErrors.email;
      }
      break;

    case "password":
      const passwordValidation = validatePassword(password.value, true);
      if (!passwordValidation.isValid) {
        validationErrors.password = passwordValidation.errors;
      } else {
        delete validationErrors.password;
      }
      break;
  }
};

const clearFieldError = (fieldName) => {
  if (validationErrors[fieldName]) {
    delete validationErrors[fieldName];
  }
  // También limpiar error del servidor cuando el usuario empiece a escribir
  if (error.value) {
    error.value = "";
  }
};

const validateForm = () => {
  const emailValidation = validateEmail(email.value);
  const passwordValidation = validatePassword(password.value, true);

  // Limpiar errores anteriores
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key]);

  // Agregar errores si existen
  if (!emailValidation.isValid) {
    validationErrors.email = emailValidation.errors;
  }

  if (!passwordValidation.isValid) {
    validationErrors.password = passwordValidation.errors;
  }

  return {
    isValid: emailValidation.isValid && passwordValidation.isValid,
    sanitizedData: {
      email: emailValidation.sanitized || email.value,
      password: password.value,
    },
  };
};

// ============================================
// TU LÓGICA ORIGINAL (mantenida intacta)
// ============================================

// Verificar si ya está logueado
onMounted(() => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  console.log("🔍 Verificando estado de login:", {
    token: !!token,
    user: !!user,
  });

  if (token && user) {
    debugInfo.value = "Usuario ya logueado, redirigiendo...";
    router.push("/chat");
  }
});

const handleLogin = async () => {
  console.log("🚀 Iniciando proceso de login...");

  // ============================================
  // VALIDACIÓN FRONTEND AGREGADA
  // ============================================
  const validation = validateForm();

  if (!validation.isValid) {
    console.log("❌ Validación frontend fallida:", validationErrors);
    return; // No continuar si hay errores de validación
  }

  error.value = "";
  success.value = "";
  loading.value = true;
  debugInfo.value = "Enviando credenciales...";

  try {
    console.log(
      "📡 Enviando request a:",
      "http://localhost:3000/api/auth/login"
    );
    console.log("📋 Datos sanitizados:", {
      email: validation.sanitizedData.email,
      password: "***",
    });

    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validation.sanitizedData.email, // Usar datos sanitizados
        password: validation.sanitizedData.password,
      }),
    });

    console.log("📊 Status de respuesta:", res.status, res.statusText);

    const data = await res.json();
    console.log("📦 Respuesta completa del servidor:", data);

    debugInfo.value = `Respuesta: ${res.status} - ${JSON.stringify(
      data,
      null,
      2
    )}`;

    if (!res.ok) {
      // Manejar errores específicos del servidor
      if (res.status === 429) {
        throw new Error("Demasiados intentos. Intenta de nuevo en 15 minutos.");
      } else if (res.status === 404) {
        throw new Error("Usuario no encontrado");
      } else if (res.status === 401) {
        throw new Error("Contraseña incorrecta");
      } else {
        throw new Error(data.message || "Error al iniciar sesión");
      }
    }

    // Verificar estructura de respuesta
    if (data.success) {
      // Formato nuevo con success: true
      console.log("✅ Login exitoso (formato nuevo)");

      if (data.data && data.data.token && data.data.usuario) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.usuario));

        console.log("💾 Datos guardados:");
        console.log("   Token:", data.data.token.substring(0, 20) + "...");
        console.log("   Usuario:", data.data.usuario);

        success.value = "Login exitoso! Redirigiendo...";
        debugInfo.value = "Datos guardados, redirigiendo en 2 segundos...";

        setTimeout(() => {
          console.log("🚀 Redirigiendo al chat...");
          router.push("/chat");
        }, 2000);
      } else {
        throw new Error(
          "Estructura de respuesta inválida: faltan token o usuario"
        );
      }
    } else if (data.token && data.usuario) {
      // Formato antiguo sin success
      console.log("✅ Login exitoso (formato antiguo)");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));

      console.log("💾 Datos guardados:");
      console.log("   Token:", data.token.substring(0, 20) + "...");
      console.log("   Usuario:", data.usuario);

      success.value = "Login exitoso! Redirigiendo...";
      debugInfo.value = "Datos guardados, redirigiendo en 2 segundos...";

      setTimeout(() => {
        console.log("🚀 Redirigiendo al chat...");
        router.push("/chat");
      }, 2000);
    } else {
      throw new Error("Estructura de respuesta inesperada");
    }
  } catch (err) {
    console.error("❌ Error en login:", err);
    error.value = err.message;
    debugInfo.value = `Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Función para limpiar debug info
const clearDebug = () => {
  debugInfo.value = "";
};
</script>
