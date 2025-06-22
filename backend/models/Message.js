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
      validate: {
        notNull: {
          msg: "user_id es requerido",
        },
        isInt: {
          msg: "user_id debe ser un número entero",
        },
      },
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      validate: {
        isInt: {
          msg: "receiver_id debe ser un número entero",
        },
        // Validar que no se envíe mensaje a sí mismo
        notSelfMessage(value) {
          if (value === this.user_id) {
            throw new Error("No puedes enviarte un mensaje a ti mismo");
          }
        },
      },
    },
    type: {
      type: DataTypes.ENUM("text", "image", "audio", "document", "video"),
      defaultValue: "text",
      validate: {
        isIn: {
          args: [["text", "image", "audio", "document", "video"]],
          msg: "Tipo de mensaje no válido",
        },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        // Validar que hay contenido o media_url
        contentOrMedia() {
          if (!this.content && !this.media_url) {
            throw new Error(
              "Debe proporcionar contenido de texto o un archivo"
            );
          }
        },
      },
    },
    media_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("metadata");
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue("metadata", value ? JSON.stringify(value) : null);
      },
    },
    leido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editado_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["receiver_id"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["user_id", "receiver_id", "createdAt"],
      },
    ],
    // ✅ REMOVER hooks que pueden causar problemas con referencias circulares
    // Las validaciones de existencia de usuarios se harán en el controller
  }
);

module.exports = Message;
