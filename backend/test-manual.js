const axios = require("axios");

async function testManual() {
  console.log("🧪 PRUEBA MANUAL DEL WEBHOOK\n");

  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123456789",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "123456789",
              },
              contacts: [
                {
                  profile: { name: "Prueba Manual" },
                  wa_id: "51987654321",
                },
              ],
              messages: [
                {
                  from: "51987654321",
                  id: "manual_test_001",
                  timestamp: Date.now().toString(),
                  text: { body: "🧪 Mensaje de prueba manual desde script" },
                  type: "text",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };

  try {
    console.log("📤 Enviando mensaje al webhook...");
    console.log(
      "🔗 URL:",
      "https://8f04-132-191-0-49.ngrok-free.app/webhook/whatsapp"
    );

    const response = await axios.post(
      "https://8f04-132-191-0-49.ngrok-free.app/webhook/whatsapp",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("✅ Prueba manual EXITOSA!");
      console.log("📋 Revisa los logs de tu servidor (node index.js)");
      console.log("🗃️ También revisa tu base de datos");
    } else {
      console.log("❌ Prueba manual falló");
      console.log("Status:", response.status);
    }
  } catch (error) {
    console.log("❌ Error en prueba manual:");
    console.log("Mensaje:", error.message);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }

    console.log("\n🔍 Posibles problemas:");
    console.log("- ¿Está corriendo tu servidor? (node index.js)");
    console.log("- ¿Está corriendo ngrok? (ngrok http 3000)");
    console.log("- ¿La URL de ngrok cambió?");
  }
}

testManual();
