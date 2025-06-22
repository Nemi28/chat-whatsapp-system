const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configurar conexión a la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || "chat_whatsapp",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "12345",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Sin logs de SQL
  }
);

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

let lastMessageId = 0;

async function checkNewMessages() {
  try {
    const [results] = await sequelize.query(
      `
      SELECT 
        m.id,
        m.type,
        m.content,
        m.media_url,
        m.createdAt,
        u.nombre,
        u.phone
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id > :lastId
      ORDER BY m.id ASC
    `,
      {
        replacements: { lastId: lastMessageId },
      }
    );

    if (results.length > 0) {
      log(
        colors.bold + colors.cyan,
        `\n📨 ${results.length} NUEVO(S) MENSAJE(S) DETECTADO(S):`
      );
      log(colors.cyan, "=".repeat(60));

      for (const msg of results) {
        const timestamp = new Date(msg.createdAt).toLocaleString("es-PE");

        log(colors.bold + colors.green, `\n👤 ${msg.nombre} (${msg.phone})`);
        log(colors.blue, `📅 ${timestamp}`);
        log(colors.yellow, `📝 Tipo: ${msg.type.toUpperCase()}`);

        if (msg.type === "text") {
          log(colors.reset, `💬 "${msg.content}"`);
        } else {
          log(colors.reset, `📎 ${msg.content}`);
          if (msg.media_url) {
            log(colors.magenta, `🔗 Archivo: ${msg.media_url}`);
          }
        }

        log(colors.cyan, "─".repeat(40));
        lastMessageId = Math.max(lastMessageId, msg.id);
      }
    }
  } catch (error) {
    log(colors.red, `❌ Error consultando mensajes: ${error.message}`);
  }
}

async function showStats() {
  try {
    const [userCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM users
    `);

    const [messageCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM messages
    `);

    const [recentMessages] = await sequelize.query(`
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    log(colors.bold + colors.blue, "\n📊 ESTADÍSTICAS:");
    log(colors.blue, "─".repeat(30));
    log(colors.reset, `👥 Total usuarios: ${userCount[0].total}`);
    log(colors.reset, `💬 Total mensajes: ${messageCount[0].total}`);
    log(colors.reset, `🕐 Mensajes última hora: ${recentMessages[0].total}`);
    log(colors.blue, "─".repeat(30));
  } catch (error) {
    log(colors.red, `❌ Error obteniendo estadísticas: ${error.message}`);
  }
}

async function initialize() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    log(colors.green, "✅ Conectado a la base de datos");

    // Obtener ID del último mensaje
    const [lastMessage] = await sequelize.query(`
      SELECT MAX(id) as lastId FROM messages
    `);

    lastMessageId = lastMessage[0].lastId || 0;
    log(
      colors.yellow,
      `🔍 Monitoreando mensajes desde ID: ${lastMessageId + 1}`
    );

    // Mostrar estadísticas iniciales
    await showStats();

    log(colors.bold + colors.green, "\n🎯 MONITOR DE MENSAJES INICIADO");
    log(colors.green, "📱 Envía mensajes a tu WhatsApp para verlos aquí...");
    log(colors.yellow, "⌨️  Presiona Ctrl+C para detener\n");

    // Monitorear cada 2 segundos
    setInterval(checkNewMessages, 2000);

    // Mostrar estadísticas cada 30 segundos
    setInterval(showStats, 30000);
  } catch (error) {
    log(colors.red, `❌ Error inicializando monitor: ${error.message}`);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  log(colors.yellow, "\n🛑 Cerrando monitor...");
  await sequelize.close();
  log(colors.green, "✅ Monitor cerrado correctamente");
  process.exit(0);
});

// Iniciar monitor
initialize();
