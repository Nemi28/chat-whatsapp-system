// services/socket.js
import { io } from "socket.io-client";
import { config } from "./api.js";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(config.socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      if (config.debugMode) {
        console.log("✅ Socket conectado");
      }
    });

    this.socket.on("disconnect", () => {
      if (config.debugMode) {
        console.log("❌ Socket desconectado");
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión del socket:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Unirse a una sala específica
  joinRoom(room) {
    if (this.socket) {
      this.socket.emit("join", room);
      if (config.debugMode) {
        console.log(`🔗 Uniéndose a la sala: ${room}`);
      }
    }
  }

  // Escuchar eventos con callback
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);

      // Guardar referencia para poder removerla después
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remover listeners específicos
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);

      // Remover de nuestro registro
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Remover todos los listeners de un evento
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  // Emitir eventos
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Verificar si está conectado
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Obtener el socket instance (para casos especiales)
  getSocket() {
    return this.socket;
  }
}

// Instancia singleton
const socketService = new SocketService();

export default socketService;
