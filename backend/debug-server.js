const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// ✅ Cargar variables de entorno PRIMERO
dotenv.config();

console.log("🔍 ================================");
console.log("🔍 DEBUG: INICIANDO SERVIDOR...");
console.log("🔍 ================================\n");

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

    console.log("✅ Asociaciones configuradas correctamente\n");
  } catch (error) {
    console.error("❌ Error en asociaciones:", error);
    throw error;
  }
};

console.log("📦 Creando app Express...");
const app = express();
console.log("✅ App Express creada\n");

console.log("🌐 Creando servidor HTTP...");
const server = http.createServer(app);
console.log("✅ Servidor HTTP creado\n");

console.log("🔌 Configurando CORS...");
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};
app.use(cors(corsOptions));
console.log("✅ CORS configurado\n");

console.log("🔌 Configurando Socket.IO...");
try {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  app.set("io", io);
  console.log("✅ Socket.IO configurado\n");
} catch (error) {
  console.error("❌ Error configurando Socket.IO:", error);
  throw error;
}

console.log("⚙️ Configurando middlewares...");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
console.log("✅ Middlewares configurados\n");

// Configurar asociaciones
setupAssociations();

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
  console.log("✅ Message routes cargadas\n");
} catch (error) {
  console.error("❌ Error cargando message routes:", error);
  process.exit(1);
}

// Ruta básica
app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando" });
});

console.log("🎉 TODAS LAS RUTAS CARGADAS EXITOSAMENTE\n");

// ============================================
// AQUÍ ES DONDE PUEDE ESTAR EL PROBLEMA
// ============================================

console.log("🔌 PASO CRÍTICO: Conectando a base de datos...");
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Conexión a BD establecida");

    console.log("🔄 PASO CRÍTICO: Sincronizando modelos...");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("✅ Modelos sincronizados");

    console.log("🚀 PASO CRÍTICO: Iniciando servidor...");
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(`\n🎉 ================================`);
      console.log(`🎉 SERVIDOR INICIADO EN PUERTO ${PORT}`);
      console.log(`🎉 ================================\n`);
    });
  })
  .catch((error) => {
    console.error("\n❌ ================================");
    console.error("❌ ERROR EN STARTUP:");
    console.error("❌ ================================");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("❌ ================================\n");
    process.exit(1);
  });
