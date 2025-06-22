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
      validate: {
        notEmpty: {
          msg: "El nombre no puede estar vacío",
        },
        len: {
          args: [2, 50],
          msg: "El nombre debe tener entre 2 y 50 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "Este email ya está registrado",
      },
      validate: {
        isEmail: {
          msg: "Debe ser un email válido",
        },
        notEmpty: {
          msg: "El email no puede estar vacío",
        },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_phone",
        msg: "Este número ya está registrado",
      },
      validate: {
        notEmpty: {
          msg: "El número de teléfono no puede estar vacío",
        },
        len: {
          args: [8, 20],
          msg: "El teléfono debe tener entre 8 y 20 caracteres",
        },
        is: {
          args: /^[0-9\+]+$/i,
          msg: "El teléfono solo debe contener números o el símbolo '+'",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La contraseña no puede estar vacía",
        },
        len: {
          args: [6, 255],
          msg: "La contraseña debe tener al menos 6 caracteres",
        },
      },
    },
    rol: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
    ],
    // ✅ REMOVER User.associate - Usaremos setupAssociations en index.js
  }
);

module.exports = User;
