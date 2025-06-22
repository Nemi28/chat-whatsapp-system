const axios = require("axios");
require("dotenv").config();

// ⚙️ CONFIGURACIÓN - RUTA CORREGIDA
const BASE_URL = "http://localhost:3000";
const WEBHOOK_PATH = "/webhook/whatsapp"; // 🔥 ESTA ES LA RUTA CORRECTA
const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "tu_token_verificacion_123";

// 🎨 Colores para la consola
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

async function testServer() {
  log(colors.blue, "🔍 Verificando servidor...");
  try {
    const response = await axios.get(BASE_URL);
    log(colors.green, "✅ Servidor está corriendo");
    log(colors.green, `   Status: ${response.status}`);
    log(colors.green, `   Message: ${response.data.message}`);
    return true;
  } catch (error) {
    log(colors.red, "❌ Servidor NO responde:");
    log(colors.red, `   ${error.message}`);
    return false;
  }
}

async function testWebhookVerification() {
  log(colors.blue, "\n1️⃣ PROBANDO VERIFICACIÓN GET...");
  log(colors.yellow, `   URL: ${BASE_URL}${WEBHOOK_PATH}`);

  try {
    const response = await axios.get(`${BASE_URL}${WEBHOOK_PATH}`, {
      params: {
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "test_challenge_12345",
      },
    });

    if (response.status === 200 && response.data === "test_challenge_12345") {
      log(colors.green, "✅ Verificación GET: EXITOSA");
      log(colors.green, `   Status: ${response.status}`);
      log(colors.green, `   Response: ${response.data}`);
      return true;
    } else {
      log(colors.red, "❌ Verificación GET: FALLÓ");
      log(colors.red, `   Status: ${response.status}`);
      log(colors.red, `   Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    log(colors.red, "❌ Error en verificación GET:");
    log(colors.red, `   ${error.message}`);
    if (error.response) {
      log(colors.red, `   Status: ${error.response.status}`);
      log(
        colors.red,
        `   Data: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
    return false;
  }
}

async function testTextMessage() {
  log(colors.blue, "\n2️⃣ PROBANDO MENSAJE DE TEXTO...");

  const textPayload = {
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
                  profile: { name: "Usuario Prueba Local" },
                  wa_id: "51987654321",
                },
              ],
              messages: [
                {
                  from: "51987654321",
                  id: "test_msg_001",
                  timestamp: Date.now().toString(),
                  text: {
                    body: "¡Hola! Este es un mensaje de prueba desde el script 🚀",
                  },
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
    const response = await axios.post(
      `${BASE_URL}${WEBHOOK_PATH}`,
      textPayload
    );

    if (response.status === 200) {
      log(colors.green, "✅ Mensaje de texto: EXITOSO");
      log(colors.green, `   Status: ${response.status}`);
      return true;
    } else {
      log(colors.red, "❌ Mensaje de texto: FALLÓ");
      log(colors.red, `   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, "❌ Error en mensaje de texto:");
    log(colors.red, `   ${error.message}`);
    if (error.response) {
      log(colors.red, `   Status: ${error.response.status}`);
      log(
        colors.red,
        `   Data: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
    return false;
  }
}

async function testImageMessage() {
  log(colors.blue, "\n3️⃣ PROBANDO MENSAJE CON IMAGEN (simulado)...");

  const imagePayload = {
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
                  profile: { name: "Usuario Imagen Test" },
                  wa_id: "51987654322",
                },
              ],
              messages: [
                {
                  from: "51987654322",
                  id: "test_img_001",
                  timestamp: Date.now().toString(),
                  image: {
                    caption: "Esta es una imagen de prueba 📸",
                    mime_type: "image/jpeg",
                    id: "fake_image_id_para_prueba",
                  },
                  type: "image",
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
    const response = await axios.post(
      `${BASE_URL}${WEBHOOK_PATH}`,
      imagePayload
    );

    if (response.status === 200) {
      log(colors.green, "✅ Mensaje con imagen: EXITOSO");
      log(colors.green, `   Status: ${response.status}`);
      log(
        colors.yellow,
        "   ⚠️  Nota: La descarga fallará porque el ID es falso, pero el mensaje se guardará"
      );
      return true;
    } else {
      log(colors.red, "❌ Mensaje con imagen: FALLÓ");
      log(colors.red, `   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, "❌ Error en mensaje con imagen:");
    log(colors.red, `   ${error.message}`);
    return false;
  }
}

async function testMultipleUsers() {
  log(colors.blue, "\n4️⃣ PROBANDO MÚLTIPLES USUARIOS...");

  const users = [
    { name: "Ana García", phone: "51911111111", message: "Hola, soy Ana" },
    {
      name: "Carlos López",
      phone: "51922222222",
      message: "Saludos desde Carlos",
    },
    { name: "María Silva", phone: "51933333333", message: "María aquí 👋" },
  ];

  let successCount = 0;

  for (const user of users) {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "123456789",
          changes: [
            {
              value: {
                contacts: [
                  {
                    profile: { name: user.name },
                    wa_id: user.phone,
                  },
                ],
                messages: [
                  {
                    from: user.phone,
                    id: `test_${user.phone}`,
                    timestamp: Date.now().toString(),
                    text: { body: user.message },
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
      const response = await axios.post(`${BASE_URL}${WEBHOOK_PATH}`, payload);
      if (response.status === 200) {
        log(colors.green, `   ✅ ${user.name}: EXITOSO`);
        successCount++;
      }
    } catch (error) {
      log(colors.red, `   ❌ ${user.name}: ERROR - ${error.message}`);
    }

    // Pequeña pausa entre requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  log(
    colors.blue,
    `\n   📊 Resultado: ${successCount}/${users.length} usuarios procesados correctamente`
  );
  return successCount === users.length;
}

async function runAllTests() {
  log(
    colors.bold + colors.blue,
    "🧪 INICIANDO PRUEBAS DEL WEBHOOK DE WHATSAPP"
  );
  log(colors.blue, "================================================");
  log(colors.yellow, `🔗 Webhook URL: ${BASE_URL}${WEBHOOK_PATH}`);
  log(colors.yellow, `🔑 Verify Token: ${VERIFY_TOKEN}\n`);

  // Verificar que el servidor esté funcionando
  const serverOk = await testServer();
  if (!serverOk) {
    log(colors.red, "\n🚨 SERVIDOR NO ESTÁ FUNCIONANDO");
    log(colors.yellow, "💡 Ejecuta: npm start o node index.js");
    return;
  }

  // Ejecutar todas las pruebas
  const tests = [
    { name: "Verificación", test: testWebhookVerification },
    { name: "Mensaje de texto", test: testTextMessage },
    { name: "Mensaje con imagen", test: testImageMessage },
    { name: "Múltiples usuarios", test: testMultipleUsers },
  ];

  let passedTests = 0;
  for (const { name, test } of tests) {
    const result = await test();
    if (result) passedTests++;
  }

  // Resumen final
  log(colors.bold + colors.blue, "\n🏁 PRUEBAS COMPLETADAS!");
  log(colors.blue, "================================");
  log(
    colors.bold,
    `📊 Resultado: ${passedTests}/${tests.length} pruebas exitosas`
  );

  if (passedTests === tests.length) {
    log(colors.green, "🎉 ¡TODAS LAS PRUEBAS PASARON!");
  } else {
    log(colors.yellow, "⚠️  Algunas pruebas fallaron, revisa los logs arriba");
  }

  log(colors.yellow, "\n📋 PRÓXIMOS PASOS:");
  log(colors.yellow, "1. Verifica tu base de datos con estas consultas:");
  log(colors.reset, "   SELECT * FROM users ORDER BY createdAt DESC LIMIT 10;");
  log(
    colors.reset,
    "   SELECT * FROM messages ORDER BY createdAt DESC LIMIT 10;"
  );
  log(
    colors.yellow,
    "\n2. Revisa los logs de tu servidor para ver los mensajes procesados"
  );
  log(
    colors.yellow,
    "3. Para probar con WhatsApp real, usa ngrok y configura en Meta Developers:"
  );
  log(
    colors.reset,
    `   Webhook URL: https://tu-ngrok-url.ngrok.io${WEBHOOK_PATH}`
  );
}

// Ejecutar todas las pruebas
runAllTests().catch((error) => {
  log(colors.red, "💥 Error fatal en las pruebas:");
  log(colors.red, error.message);
  process.exit(1);
});
