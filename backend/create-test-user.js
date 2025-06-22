// create-test-users.js - Ejecutar desde el backend
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Message = require("./models/Message");
const sequelize = require("./config/database");

const createTestUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos");

    // Usuarios de prueba
    const testUsers = [
      { nombre: "Ana García", email: "ana@test.com", password: "123456" },
      { nombre: "Carlos López", email: "carlos@test.com", password: "123456" },
      {
        nombre: "María Rodríguez",
        email: "maria@test.com",
        password: "123456",
      },
      { nombre: "Pedro Martínez", email: "pedro@test.com", password: "123456" },
    ];

    console.log("🔐 Creando usuarios de prueba...");

    for (const userData of testUsers) {
      // Verificar si ya existe
      const existing = await User.findOne({ where: { email: userData.email } });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await User.create({
          nombre: userData.nombre,
          email: userData.email,
          password: hashedPassword,
        });

        console.log(`✅ Usuario creado: ${user.nombre} (${user.email})`);
      } else {
        console.log(`ℹ️ Usuario ya existe: ${userData.email}`);
      }
    }

    // Crear algunos mensajes de prueba
    console.log("💬 Creando mensajes de prueba...");

    const users = await User.findAll();
    if (users.length >= 2) {
      const messages = [
        {
          user_id: users[1].id,
          receiver_id: users[0].id,
          content: "¡Hola! ¿Cómo estás?",
        },
        {
          user_id: users[0].id,
          receiver_id: users[1].id,
          content: "Todo bien, gracias! ¿Y tú?",
        },
        {
          user_id: users[2]?.id,
          receiver_id: users[0].id,
          content: "Buenos días!",
        },
      ];

      for (const msgData of messages) {
        if (msgData.user_id && msgData.receiver_id) {
          await Message.create({
            ...msgData,
            type: "text",
          });
        }
      }

      console.log(`✅ ${messages.length} mensajes de prueba creados`);
    }

    console.log("\n🎉 ¡Datos de prueba creados exitosamente!");
    console.log("📧 Puedes loguearte con cualquiera de estos usuarios:");
    console.log("   - ana@test.com / 123456");
    console.log("   - carlos@test.com / 123456");
    console.log("   - maria@test.com / 123456");
    console.log("   - pedro@test.com / 123456");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
  }
};

createTestUsers();
