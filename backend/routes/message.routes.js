const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const verifyToken = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Ruta para crear un mensaje
router.post("/", verifyToken, async (req, res) => {
  try {
    const { type, content, media_url } = req.body;

    const nuevoMensaje = await Message.create({
      user_id: req.user.id,
      type,
      content,
      media_url,
    });

    res.status(201).json({
      message: "Mensaje guardado correctamente",
      data: nuevoMensaje,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al guardar el mensaje", error });
  }
});

// Subida de archivos (imagen, audio, documento)
router.post(
  "/upload",
  verifyToken,
  upload.single("archivo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se envió ningún archivo" });
      }

      const tipoArchivo = req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("audio/")
        ? "audio"
        : "document";

      const nuevoMensaje = await Message.create({
        user_id: req.user.id,
        type: tipoArchivo,
        content: null,
        media_url: req.file.path, // ruta local del archivo
      });

      res.status(201).json({
        message: "Archivo subido y mensaje guardado",
        data: nuevoMensaje,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al subir el archivo", error });
    }
  }
);

// Ruta para obtener todos los mensajes del usuario logueado
router.get("/", verifyToken, async (req, res) => {
  try {
    const mensajes = await Message.findAll({
      where: { user_id: req.user.id },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      message: "Mensajes obtenidos correctamente",
      data: mensajes,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los mensajes", error });
  }
});

// Obtener mensajes por usuario ID
router.get("/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const mensajes = await Message.findAll({
      where: { user_id: userId },
      order: [["createdAt", "ASC"]],
    });

    res.json({ mensajes });
  } catch (error) {
    console.error("❌ Error al obtener mensajes:", error);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
});

module.exports = router;
