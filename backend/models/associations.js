// associations.js - Crear este archivo en tu carpeta models o config

const User = require("./models/User");
const Message = require("./models/Message");

// ✅ Configurar todas las asociaciones
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

module.exports = setupAssociations;
