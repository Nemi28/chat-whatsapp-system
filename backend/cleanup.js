// cleanup.js - Ejecutar antes de iniciar el servidor
const sequelize = require("./config/database");

const cleanupDatabase = async () => {
  try {
    console.log("🧹 Iniciando limpieza de datos inconsistentes...");

    // 1. Eliminar mensajes huérfanos (sin usuario válido)
    const [deletedMessages] = await sequelize.query(`
      DELETE m FROM messages m 
      LEFT JOIN users u1 ON m.user_id = u1.id 
      LEFT JOIN users u2 ON m.receiver_id = u2.id 
      WHERE u1.id IS NULL OR u2.id IS NULL
    `);

    console.log(
      `🗑️ Eliminados ${deletedMessages.affectedRows || 0} mensajes huérfanos`
    );

    // 2. Verificar integridad
    const [orphanedMessages] = await sequelize.query(`
      SELECT m.id, m.user_id, m.receiver_id 
      FROM messages m 
      LEFT JOIN users u1 ON m.user_id = u1.id 
      LEFT JOIN users u2 ON m.receiver_id = u2.id 
      WHERE u1.id IS NULL OR u2.id IS NULL
    `);

    if (orphanedMessages.length > 0) {
      console.log("⚠️ Aún hay mensajes huérfanos:", orphanedMessages);
    } else {
      console.log("✅ No hay mensajes huérfanos");
    }

    // 3. Mostrar estadísticas
    const [userCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const [messageCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM messages"
    );

    console.log(`📊 Estadísticas:`);
    console.log(`   - Usuarios: ${userCount[0].count}`);
    console.log(`   - Mensajes: ${messageCount[0].count}`);

    console.log("✅ Limpieza completada");
  } catch (error) {
    console.error("❌ Error en limpieza:", error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => cleanupDatabase())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = cleanupDatabase;
