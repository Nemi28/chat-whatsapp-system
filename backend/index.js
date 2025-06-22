const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ✅ Cargar variables de entorno PRIMERO
dotenv.config();

const sequelize = require("./config/database");
const User = require("./models/User");
const Message = require("./models/Message");

// ✅ CONFIGURAR ASOCIACIONES
const setupAssociations = () => {
  console.log("🔗 Configurando asociaciones de modelos...");

  try {
    User.hasMany(Message, {
      foreignKey: "user_id",
      as: "sentMessages",
    });

    User.hasMany(Message, {
      foreignKey: "receiver_id",
      as: "receivedMessages",
    });

    Message.belongsTo(User, {
      foreignKey: "user_id",
      as: "sender",
    });

    Message.belongsTo(User, {
      foreignKey: "receiver_id",
      as: "receiver",
    });

    console.log("✅ Asociaciones configuradas correctamente");
  } catch (error) {
    console.error("❌ Error en asociaciones:", error);
    throw error;
  }
};

const app = express();
const server = http.createServer(app);

// ============================================
// 🔒 CONFIGURACIÓN DE SEGURIDAD CON HELMET
// ============================================
console.log("🛡️ Configurando headers de seguridad...");
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);
console.log("✅ Headers de seguridad configurados");

// ============================================
// 🚦 CONFIGURACIÓN DE RATE LIMITING
// ============================================
console.log("🚦 Configurando rate limiting...");

// Rate limiter general para todas las APIs
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP cada 15 minutos
  message: {
    success: false,
    message:
      "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message:
        "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
});

// Rate limiter estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP cada 15 minutos
  message: {
    success: false,
    message: "Demasiados intentos de login, intenta de nuevo en 15 minutos.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit de auth excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Demasiados intentos de login, intenta de nuevo en 15 minutos.",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
    });
  },
});

// Aplicar rate limiting general a todas las APIs
app.use("/api/", generalLimiter);

// Rate limiting específico para autenticación
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

console.log("✅ Rate limiting configurado");

// ============================================
// CONFIGURACIÓN CORS
// ============================================
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ============================================
// CONFIGURACIÓN SOCKET.IO
// ============================================
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

app.set("io", io);

// ============================================
// MIDDLEWARES
// ============================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Webhook WhatsApp: usar raw para Meta antes de express.json
//const bodyParser = require("body-parser");
//app.use("/webhook/whatsapp", bodyParser.raw({ type: "application/json" }));
//app.use("/webhook/whatsapp", express.raw({ type: "application/json" }));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Servir archivos estáticos
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// Crear carpeta uploads
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Carpeta uploads creada");
}

// Logging en desarrollo
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`
    );
    next();
  });
}

// ============================================
// CONFIGURAR ASOCIACIONES ANTES DE RUTAS
// ============================================
setupAssociations();

// ============================================
// CARGAR RUTAS
// ============================================
console.log("📁 Cargando rutas...");

try {
  const authRoutes = require("./routes/auth.routes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes cargadas");
} catch (error) {
  console.error("❌ Error cargando auth routes:", error);
  process.exit(1);
}

try {
  const messageRoutes = require("./routes/message.routes");
  app.use("/api/messages", messageRoutes);
  console.log("✅ Message routes cargadas");
} catch (error) {
  console.error("❌ Error cargando message routes:", error);
  process.exit(1);
}
try {
  const webhookRoutes = require("./routes/webhook.routes");
  app.use("/webhook/whatsapp", webhookRoutes);
  console.log("✅ Webhook routes cargadas");
} catch (error) {
  console.error("❌ Error cargando webhook routes:", error);
  process.exit(1);
}

// ============================================
// RUTAS BÁSICAS
// ============================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Servidor backend funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    frontend_url: process.env.FRONTEND_URL,
    security: {
      helmet: "🛡️ Headers de seguridad activos",
      rateLimit: "🚦 Rate limiting activo",
      limits: {
        general: "100 req/15min",
        auth: "5 req/15min",
      },
    },
    routes: {
      auth: "/api/auth",
      messages: "/api/messages",
      test: "/api/test",
    },
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "CORS funcionando correctamente",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    security: {
      helmet: "🔒 Helmet activo",
      rateLimit: "🚦 Rate limiting activo",
      ip: req.ip,
    },
  });
});

// ============================================
// WEBSOCKET
// ============================================
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`👤 Socket ${socket.id} se unió a la sala: ${room}`);
    socket.emit("joined_room", { room, success: true });
  });

  socket.on("join_user_room", (userId) => {
    const room = `user_${userId}`;
    socket.join(room);
    console.log(`👤 Usuario ${userId} se unió a su sala personal: ${room}`);
    socket.emit("joined_room", { room, success: true });
  });

  socket.on("leave", (room) => {
    socket.leave(room);
    console.log(`🚪 Socket ${socket.id} salió de la sala: ${room}`);
  });

  socket.on("typing", (data) => {
    socket.to(`user_${data.receiverId}`).emit("user_typing", {
      userId: data.userId,
      isTyping: true,
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(`user_${data.receiverId}`).emit("user_stop_typing", {
      userId: data.userId,
      isTyping: false,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Cliente desconectado:", socket.id, "- Razón:", reason);
  });

  socket.on("test_message", (data) => {
    console.log("📨 Mensaje de prueba:", data);
    socket.emit("test_response", {
      message: "Mensaje recibido",
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
  });

  socket.on("error", (error) => {
    console.error("❌ Error en socket:", error);
  });
});

// ============================================
// FUNCIONES HELPER
// ============================================
const emitToUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
  console.log(`📤 Emitiendo '${event}' a usuario ${userId}`);
};

const emitToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
  console.log(`📤 Emitiendo '${event}' a sala ${room}`);
};

app.set("emitToUser", emitToUser);
app.set("emitToRoom", emitToRoom);

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  res.header(
    "Access-Control-Allow-Origin",
    req.headers.origin || process.env.FRONTEND_URL
  );
  res.header("Access-Control-Allow-Credentials", "true");

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { error: err.stack }),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      "GET /",
      "GET /api/test",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/messages/conversaciones/usuarios",
      "GET /api/messages/:userId",
      "POST /api/messages",
    ],
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const startServer = async () => {
  try {
    console.log("🔌 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    console.log("🔄 Sincronizando modelos...");
    await sequelize.sync({ alter: true });
    console.log("✅ Modelos sincronizados con la base de datos");

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`\n🚀 ================================`);
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(
        `🌐 Frontend URL: ${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }`
      );
      console.log(`🔌 Socket.IO listo`);
      console.log(`📁 Archivos estáticos: /uploads`);
      console.log(`🛡️ Seguridad:`);
      console.log(`   - Helmet: Headers seguros`);
      console.log(`   - Rate Limit: 100 req/15min general, 5 req/15min auth`);
      console.log(`🚀 ================================\n`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();

// Shutdown graceful
process.on("SIGTERM", () => {
  console.log("🛑 Cerrando servidor...");
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Cerrando servidor...");
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

module.exports = app;
