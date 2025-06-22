// minimal-test.js - Probar cada componente por separado

const express = require("express");
const http = require("http");

console.log("🧪 PRUEBA 1: Express básico...");
const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.json({ message: "Express funciona" });
});

console.log("✅ Express configurado");

console.log("\n🧪 PRUEBA 2: Socket.IO...");
try {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });
  console.log("✅ Socket.IO configurado");
} catch (error) {
  console.error("❌ Error en Socket.IO:", error.message);
}

console.log("\n🧪 PRUEBA 3: Sequelize...");
try {
  const sequelize = require("./config/database");
  console.log("✅ Sequelize importado");

  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Conexión a BD exitosa");

      console.log("\n🧪 PRUEBA 4: Modelos...");
      const User = require("./models/User");
      const Message = require("./models/Message");
      console.log("✅ Modelos importados");

      console.log("\n🧪 PRUEBA 5: Sync de modelos...");
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      console.log("✅ Modelos sincronizados exitosamente");

      console.log("\n🧪 PRUEBA 6: Iniciar servidor...");
      server.listen(3001, () => {
        console.log("✅ Servidor iniciado en puerto 3001");
        console.log("\n🎉 TODAS LAS PRUEBAS EXITOSAS");
        console.log("El problema NO está en los componentes básicos");
      });
    })
    .catch((error) => {
      console.error("\n❌ ERROR EN SEQUELIZE/MODELOS:");
      console.error("Mensaje:", error.message);
      console.error("Tipo:", error.name);
      console.error("Stack:", error.stack);
    });
} catch (error) {
  console.error("❌ Error importando Sequelize:", error.message);
}
