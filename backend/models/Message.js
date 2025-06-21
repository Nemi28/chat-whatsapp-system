// Message.js - Versión más robusta
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("text", "image", "audio", "document"),
      defaultValue: "text",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    // ✅ Opciones adicionales para manejo robusto
    hooks: {
      // Validar que los usuarios existan antes de crear mensaje
      beforeCreate: async (message, options) => {
        const User = require("./User");

        const sender = await User.findByPk(message.user_id);
        if (!sender) {
          throw new Error(`Usuario remitente ${message.user_id} no existe`);
        }

        const receiver = await User.findByPk(message.receiver_id);
        if (!receiver) {
          throw new Error(`Usuario receptor ${message.receiver_id} no existe`);
        }
      },
    },
  }
);

module.exports = Message;
