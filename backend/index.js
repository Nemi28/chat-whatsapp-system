const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const sequelize = require("./config/database");
const User = require("./models/User");
const Message = require("./models/Message");

// ✅ IMPORTANTE: Configurar asociaciones ANTES de usar los modelos
const setupAssociations = () => {
  // User -> Message (como remitente)
  User.hasMany(Message, {
    foreignKey: "user_id",
    as: "sentMessages",
  });

  // User -> Message (como receptor)
  User.hasMany(Message, {
    foreignKey: "receiver_id",
    as: "receivedMessages",
  });

  // Message -> User (remitente)
  Message.belongsTo(User, {
    foreignKey: "user_id",
    as: "sender",
  });

  // Message -> User (receptor)
  Message.belongsTo(User, {
    foreignKey: "receiver_id",
    as: "receiver",
  });

  console.log("✅ Asociaciones de modelos configuradas correctamente");
};

// Configurar asociaciones
setupAssociations();

const messageRoutes = require("./routes/message.routes");
const authRoutes = require("./routes/auth.routes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ CRÍTICO: Hacer que io esté disponible en todas las rutas
app.set("io", io);

// Middlewares
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Servidor backend funcionando");
});

// ✅ WebSocket con Socket.IO mejorado
io.on("connection", (socket) => {
  console.log("🟢 Nuevo cliente conectado:", socket.id);

  // Cuando un usuario se autentifica, unirlo a su sala personal
  socket.on("join_user_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuario ${userId} se unió a su sala personal`);
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });

  // Evento para testing
  socket.on("test_message", (data) => {
    console.log("📨 Mensaje de prueba recibido:", data);
    socket.emit("test_response", { message: "Mensaje recibido correctamente" });
  });
});

// Conexión a la base de datos
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Conexión a la base de datos establecida");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("🟢 Modelos sincronizados con la base de datos");
  })
  .catch((err) => console.error("❌ Error de conexión:", err));

// Puerto
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO listo para conexiones`);
});
