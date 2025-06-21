const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// ✅ Definir asociaciones
User.associate = (models) => {
  // Un usuario puede enviar muchos mensajes
  User.hasMany(models.Message, {
    foreignKey: "user_id",
    as: "sentMessages",
  });

  // Un usuario puede recibir muchos mensajes
  User.hasMany(models.Message, {
    foreignKey: "receiver_id",
    as: "receivedMessages",
  });
};

module.exports = User;
