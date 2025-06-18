const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si ya existe
    const existe = await User.findOne({ where: { email } });
    if (existe)
      return res.status(400).json({ message: "El correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({
        message: "Usuario registrado correctamente",
        usuario: nuevoUsuario,
      });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar", error });
  }
});

// Login de usuario
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ where: { email } });
    if (!usuario)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, usuario.password);
    if (!match)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión", error });
  }
});

module.exports = router;
