import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/LoginView.vue"; // ✅ Cambiado de LoginView a Login
import ChatView from "../views/ChatView.vue";

const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    component: Login,
    meta: { requiresGuest: true }, // ✅ Agregado para evitar acceso si ya está logueado
  },
  {
    path: "/chat",
    component: ChatView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🚨 Protección de rutas mejorada
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const isLoggedIn = !!(token && user);

  console.log("🛡️ Router Guard:", {
    to: to.path,
    isLoggedIn,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
  });

  // Si requiere autenticación y no está logueado
  if (to.meta.requiresAuth && !isLoggedIn) {
    console.log("🚫 Acceso denegado: redirigiendo a login");
    return next("/login");
  }

  // Si es página para invitados y ya está logueado
  if (to.meta.requiresGuest && isLoggedIn) {
    console.log("✅ Ya está logueado: redirigiendo al chat");
    return next("/chat");
  }

  console.log("✅ Navegación permitida");
  next();
});

export default router;
