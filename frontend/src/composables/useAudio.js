// composables/useAudio.js
import { ref, nextTick } from "vue";

export function useAudio() {
  const grabando = ref(false);
  const mediaRecorder = ref(null);
  const audioChunks = ref([]);
  const audioContext = ref(null);
  const animationId = ref(null);

  // Iniciar grabación de audio
  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder.value = new MediaRecorder(stream);
      audioChunks.value = [];

      mediaRecorder.value.ondataavailable = (e) => {
        audioChunks.value.push(e.data);
      };

      mediaRecorder.value.onstop = () => {
        const blob = new Blob(audioChunks.value, { type: "audio/webm" });
        const file = new File([blob], "grabacion.webm", { type: "audio/webm" });

        // Limpiar recursos
        cleanup();

        // Detener todas las pistas del stream
        stream.getTracks().forEach((track) => track.stop());

        // Retornar el archivo y la URL para preview
        return {
          file,
          url: URL.createObjectURL(blob),
          name: "grabacion.webm",
        };
      };

      grabando.value = true;
      mediaRecorder.value.start();

      return { success: true, stream };
    } catch (error) {
      console.error("❌ Error al grabar audio:", error);
      grabando.value = false;
      throw new Error("Error al acceder al micrófono. Verifica los permisos.");
    }
  };

  // Detener grabación
  const detenerGrabacion = () => {
    return new Promise((resolve) => {
      if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
        mediaRecorder.value.onstop = () => {
          const blob = new Blob(audioChunks.value, { type: "audio/webm" });
          const file = new File([blob], "grabacion.webm", {
            type: "audio/webm",
          });

          cleanup();

          resolve({
            file,
            url: URL.createObjectURL(blob),
            name: "grabacion.webm",
          });
        };

        mediaRecorder.value.stop();
      } else {
        resolve(null);
      }
    });
  };

  // Cancelar grabación
  const cancelarGrabacion = () => {
    if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
      mediaRecorder.value.stop();
    }

    cleanup();
    return true;
  };

  // Renderizar waveform
  const renderWaveform = async (stream, canvasRef) => {
    if (!canvasRef.value) {
      console.error("❌ Canvas no encontrado");
      return;
    }

    // Esperar a que el DOM se actualice
    await nextTick();

    try {
      audioContext.value = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.value.createMediaStreamSource(stream);
      const analyser = audioContext.value.createAnalyser();
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.value;
      const ctx = canvas.getContext("2d");

      // Configurar canvas con alta resolución
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      const draw = () => {
        if (!grabando.value) return;

        animationId.value = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = "#6366F1";

        const barWidth = canvas.width / 2 / bufferLength;

        dataArray.forEach((val, i) => {
          const barHeight = (val / 255) * (canvas.height / 4);
          ctx.fillRect(
            i * barWidth,
            canvas.height / 4 - barHeight,
            barWidth - 1,
            barHeight
          );
        });
      };

      draw();
    } catch (error) {
      console.error("❌ Error al inicializar waveform:", error);
    }
  };

  // Limpiar recursos
  const cleanup = () => {
    grabando.value = false;

    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }

    if (animationId.value) {
      cancelAnimationFrame(animationId.value);
      animationId.value = null;
    }
  };

  // Verificar soporte de audio
  const checkAudioSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  return {
    // Estado
    grabando,

    // Métodos
    iniciarGrabacion,
    detenerGrabacion,
    cancelarGrabacion,
    renderWaveform,
    cleanup,
    checkAudioSupport,
  };
}
