// route-checker.js
// Script para verificar rutas manualmente

const fs = require("fs");
const path = require("path");

// Función para leer y analizar el archivo de rutas
function checkRoutes(filePath) {
  console.log(`🔍 Analizando archivo: ${filePath}\n`);

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    let routePatterns = [];
    let errors = [];
    let lineNumber = 0;

    // Buscar patrones de rutas problemáticos
    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      // Buscar líneas que contienen definiciones de rutas
      if (
        trimmedLine.includes("router.get(") ||
        trimmedLine.includes("router.post(") ||
        trimmedLine.includes("router.put(") ||
        trimmedLine.includes("router.patch(") ||
        trimmedLine.includes("router.delete(")
      ) {
        // Extraer la ruta usando regex
        const routeMatch = trimmedLine.match(
          /router\.\w+\(\s*["'`]([^"'`]+)["'`]/
        );

        if (routeMatch) {
          const route = routeMatch[1];
          routePatterns.push({ route, line: lineNumber, content: trimmedLine });

          // Verificar patrones problemáticos
          if (route.endsWith("/:")) {
            errors.push({
              type: "PARAMETER_EMPTY",
              route,
              line: lineNumber,
              message: "Parámetro vacío al final de la ruta",
            });
          }

          if (route.includes(":/:")) {
            errors.push({
              type: "PARAMETER_SLASH",
              route,
              line: lineNumber,
              message: "Parámetro seguido de slash y dos puntos",
            });
          }

          if (route.match(/:\w*:/)) {
            errors.push({
              type: "CONSECUTIVE_PARAMS",
              route,
              line: lineNumber,
              message: "Parámetros consecutivos sin separador",
            });
          }

          if (route.includes("/:") && !route.match(/\/:\w+/)) {
            errors.push({
              type: "MALFORMED_PARAM",
              route,
              line: lineNumber,
              message: "Parámetro mal formado",
            });
          }
        }
      }
    }

    console.log("📋 RUTAS ENCONTRADAS:");
    console.log("=".repeat(50));
    routePatterns.forEach((pattern, index) => {
      const status = errors.some((e) => e.line === pattern.line) ? "❌" : "✅";
      console.log(`${status} Línea ${pattern.line}: ${pattern.route}`);
    });

    if (errors.length > 0) {
      console.log("\n🚨 ERRORES ENCONTRADOS:");
      console.log("=".repeat(50));
      errors.forEach((error, index) => {
        console.log(`❌ Error ${index + 1}:`);
        console.log(`   Línea: ${error.line}`);
        console.log(`   Ruta: ${error.route}`);
        console.log(`   Tipo: ${error.type}`);
        console.log(`   Mensaje: ${error.message}\n`);
      });

      console.log("🔧 SOLUCIONES SUGERIDAS:");
      console.log("=".repeat(50));
      errors.forEach((error, index) => {
        switch (error.type) {
          case "PARAMETER_EMPTY":
            console.log(
              `${index + 1}. Línea ${error.line}: Cambiar "${
                error.route
              }" por una ruta válida como "/users/:id"`
            );
            break;
          case "PARAMETER_SLASH":
            console.log(
              `${index + 1}. Línea ${error.line}: Revisar la sintaxis de "${
                error.route
              }"`
            );
            break;
          case "CONSECUTIVE_PARAMS":
            console.log(
              `${index + 1}. Línea ${
                error.line
              }: Separar parámetros con slash: "/:param1/:param2"`
            );
            break;
          case "MALFORMED_PARAM":
            console.log(
              `${index + 1}. Línea ${
                error.line
              }: Asegurar que el parámetro tenga nombre: "/:paramName"`
            );
            break;
        }
      });
    } else {
      console.log("\n✅ No se encontraron errores obvios en las rutas.");
    }

    // Verificar orden de rutas
    console.log("\n📊 ANÁLISIS DE ORDEN DE RUTAS:");
    console.log("=".repeat(50));

    let hasParamRoute = false;
    let paramRouteIndex = -1;

    routePatterns.forEach((pattern, index) => {
      if (pattern.route.includes(":") && !hasParamRoute) {
        hasParamRoute = true;
        paramRouteIndex = index;
      } else if (!pattern.route.includes(":") && hasParamRoute) {
        console.log(
          `⚠️  ADVERTENCIA: Ruta específica "${pattern.route}" (línea ${pattern.line}) viene después de ruta con parámetro`
        );
        console.log(
          `   Ruta con parámetro encontrada en línea ${routePatterns[paramRouteIndex].line}: ${routePatterns[paramRouteIndex].route}`
        );
        console.log(
          `   Esto puede causar que la ruta específica nunca se ejecute.\n`
        );
      }
    });
  } catch (error) {
    console.error("❌ Error al leer el archivo:", error.message);
  }
}

// Verificar si se proporciona un archivo como argumento
const filePath = process.argv[2] || "./routes/message.routes.js";

if (!fs.existsSync(filePath)) {
  console.error(`❌ Archivo no encontrado: ${filePath}`);
  console.log("💡 Uso: node route-checker.js [ruta-al-archivo]");
  console.log("💡 Ejemplo: node route-checker.js ./routes/message.routes.js");
  process.exit(1);
}

checkRoutes(filePath);
