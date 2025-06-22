// utils/validation.js - Utilidades de validación para frontend
export class ValidationUtils {
  // ============================================
  // VALIDACIONES DE EMAIL
  // ============================================
  static validateEmail(email) {
    const errors = [];

    if (!email || email.trim().length === 0) {
      errors.push("El email es obligatorio");
      return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("El formato del email no es válido");
    }

    if (email.length > 100) {
      errors.push("El email no puede exceder 100 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: email.trim().toLowerCase(),
    };
  }

  // ============================================
  // VALIDACIONES DE CONTRASEÑA
  // ============================================
  static validatePassword(password, isLogin = false) {
    const errors = [];

    if (!password) {
      errors.push("La contraseña es obligatoria");
      return { isValid: false, errors };
    }

    // Para login, solo verificar que no esté vacía
    if (isLogin) {
      return {
        isValid: password.length > 0,
        errors: password.length === 0 ? ["La contraseña es requerida"] : [],
      };
    }

    // Para registro, validaciones completas
    if (password.length < 6) {
      errors.push("La contraseña debe tener al menos 6 caracteres");
    }

    if (password.length > 100) {
      errors.push("La contraseña no puede exceder 100 caracteres");
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("La contraseña debe contener al menos una letra minúscula");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("La contraseña debe contener al menos una letra mayúscula");
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("La contraseña debe contener al menos un número");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ============================================
  // VALIDACIONES DE NOMBRE
  // ============================================
  static validateName(name) {
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push("El nombre es obligatorio");
      return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (trimmedName.length > 50) {
      errors.push("El nombre no puede exceder 50 caracteres");
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(trimmedName)) {
      errors.push("El nombre solo puede contener letras y espacios");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedName,
    };
  }

  // ============================================
  // VALIDACIONES DE MENSAJES
  // ============================================
  static validateMessage(content, hasFile = false) {
    const errors = [];

    // Si no hay archivo, el contenido es obligatorio
    if (!hasFile && (!content || content.trim().length === 0)) {
      errors.push("Debe escribir un mensaje o adjuntar un archivo");
      return { isValid: false, errors };
    }

    // Si hay contenido, validar longitud
    if (content && content.trim().length > 1000) {
      errors.push("El mensaje no puede exceder 1000 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: content ? this.sanitizeText(content.trim()) : null,
    };
  }

  // ============================================
  // VALIDACIONES DE ARCHIVOS
  // ============================================
  static validateFile(file) {
    const errors = [];

    if (!file) {
      return { isValid: true, errors: [] }; // Archivo opcional
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      errors.push(`El archivo es demasiado grande. Máximo permitido: 50MB`);
    }

    const allowedTypes = [
      // Imágenes
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/m4a",
      "audio/3gpp",
      // Documentos
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        "Tipo de archivo no permitido. Solo se permiten imágenes, audio y documentos."
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: this.formatFileSize(file.size),
      },
    };
  }

  // ============================================
  // SANITIZACIÓN DE TEXTO
  // ============================================
  static sanitizeText(text) {
    if (!text) return "";

    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remover scripts
      .replace(/<[^>]*>/g, "") // Remover tags HTML
      .replace(/javascript:/gi, "") // Remover javascript:
      .replace(/on\w+\s*=/gi, "") // Remover event handlers
      .trim();
  }

  // ============================================
  // UTILIDADES AUXILIARES
  // ============================================
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // ============================================
  // VALIDACIÓN DE FORMULARIOS COMPLETOS
  // ============================================
  static validateLoginForm(formData) {
    const errors = {};

    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors;
    }

    const passwordValidation = this.validatePassword(formData.password, true);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        email: emailValidation.sanitized || formData.email,
        password: formData.password,
      },
    };
  }

  static validateRegisterForm(formData) {
    const errors = {};

    const nameValidation = this.validateName(formData.nombre);
    if (!nameValidation.isValid) {
      errors.nombre = nameValidation.errors;
    }

    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors;
    }

    const passwordValidation = this.validatePassword(formData.password, false);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    // Validar confirmación de contraseña si existe
    if (
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = ["Las contraseñas no coinciden"];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        nombre: nameValidation.sanitized || formData.nombre,
        email: emailValidation.sanitized || formData.email,
        password: formData.password,
      },
    };
  }

  static validateMessageForm(formData, file = null) {
    const errors = {};

    const messageValidation = this.validateMessage(formData.content, !!file);
    if (!messageValidation.isValid) {
      errors.content = messageValidation.errors;
    }

    if (file) {
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        errors.file = fileValidation.errors;
      }
    }

    if (!formData.receiver_id || isNaN(formData.receiver_id)) {
      errors.receiver_id = ["Debe seleccionar un destinatario"];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        content: messageValidation.sanitized,
        receiver_id: parseInt(formData.receiver_id),
        type: formData.type || "text",
      },
    };
  }
}

// ============================================
// COMPOSABLE PARA VUE 3
// ============================================
export function useValidation() {
  const validateForm = (formType, formData, file = null) => {
    switch (formType) {
      case "login":
        return ValidationUtils.validateLoginForm(formData);
      case "register":
        return ValidationUtils.validateRegisterForm(formData);
      case "message":
        return ValidationUtils.validateMessageForm(formData, file);
      default:
        return {
          isValid: false,
          errors: { general: ["Tipo de formulario no válido"] },
        };
    }
  };

  const showErrors = (errors) => {
    // Función auxiliar para mostrar errores en la UI
    const errorMessages = [];

    Object.entries(errors).forEach(([field, fieldErrors]) => {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((error) => {
          errorMessages.push(`${field}: ${error}`);
        });
      }
    });

    return errorMessages;
  };

  return {
    validateForm,
    showErrors,
    ValidationUtils,
  };
}
