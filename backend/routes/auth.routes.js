const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");

// ============================================
// IMPORTAR VALIDACIONES
// ============================================
const {
  validateRegister,
  validateLogin,
  validateUserId,
} = require("../middlewares/validators");

// ============================================
// REGISTRO DE USUARIO
// ============================================
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si ya existe (esta validación no está en express-validator)
    const existe = await User.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
    });

    // Generar token inmediatamente después del registro
    const token = jwt.sign(
      { id: nuevoUsuario.id, rol: nuevoUsuario.rol || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        token,
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol || "user",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// LOGIN DE USUARIO
// ============================================
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol || "user",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// LOGOUT DE USUARIO
// ============================================
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // En un sistema con tokens JWT, el logout se maneja generalmente en el frontend
    // eliminando el token del localStorage. Aquí podríamos agregar el token a una
    // blacklist si quisiéramos invalidarlo en el servidor.

    res.status(200).json({
      success: true,
      message: "Logout exitoso",
    });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// PERFIL DE USUARIO
// ============================================
router.get("/perfil", verifyToken, async (req, res) => {
  try {
    // Obtener datos completos del usuario
    const usuario = await User.findByPk(req.user.id, {
      attributes: ["id", "nombre", "email", "rol", "createdAt"],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Perfil obtenido correctamente",
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          createdAt: usuario.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get("/verify", verifyToken, async (req, res) => {
  try {
    // Esta ruta permite al frontend verificar si un token sigue siendo válido
    const usuario = await User.findByPk(req.user.id, {
      attributes: ["id", "nombre", "email", "rol"],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token válido",
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar token",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// REFRESH TOKEN
// ============================================
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    // Generar un nuevo token con tiempo de vida renovado
    const nuevoToken = jwt.sign(
      { id: req.user.id, rol: req.user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Token renovado correctamente",
      data: {
        token: nuevoToken,
      },
    });
  } catch (error) {
    console.error("❌ Error al renovar token:", error);
    res.status(500).json({
      success: false,
      message: "Error al renovar token",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

// ============================================
// OBTENER TODOS LOS USUARIOS (para chat)
// ============================================
router.get("/users", verifyToken, async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ["id", "nombre", "email", "rol"],
      where: {
        id: { [require("sequelize").Op.ne]: req.user.id }, // Excluir al usuario actual
      },
      order: [["nombre", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Usuarios obtenidos correctamente",
      data: {
        usuarios,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
});

module.exports = router;
