const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const sequelize = require("./config/database");
const User = require("./models/User");
const authRoutes = require("./routes/auth.routes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Servidor backend funcionando");
});

// WebSocket con Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Nuevo cliente conectado:", socket.id);
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
});
