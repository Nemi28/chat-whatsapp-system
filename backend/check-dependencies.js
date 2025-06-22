// check-dependencies.js
console.log("🔍 VERIFICANDO DEPENDENCIAS...\n");

// Verificar versiones
const fs = require("fs");
const path = require("path");

try {
  const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));

  console.log("📦 DEPENDENCIAS PRINCIPALES:");
  console.log("express:", packageJson.dependencies?.express || "No instalado");
  console.log(
    "socket.io:",
    packageJson.dependencies?.["socket.io"] || "No instalado"
  );
  console.log(
    "sequelize:",
    packageJson.dependencies?.sequelize || "No instalado"
  );
  console.log("mysql2:", packageJson.dependencies?.mysql2 || "No instalado");
  console.log(
    "path-to-regexp:",
    packageJson.dependencies?.["path-to-regexp"] || "No en package.json"
  );

  console.log("\n🔍 VERIFICANDO MÓDULOS INSTALADOS:");

  // Verificar path-to-regexp
  try {
    const pathToRegexp = require("path-to-regexp");
    console.log("✅ path-to-regexp: INSTALADO");

    // Verificar si hay múltiples versiones
    const nodeModulesPath = "./node_modules/path-to-regexp/package.json";
    if (fs.existsSync(nodeModulesPath)) {
      const pathToRegexpPkg = JSON.parse(
        fs.readFileSync(nodeModulesPath, "utf8")
      );
      console.log("   Versión instalada:", pathToRegexpPkg.version);
    }
  } catch (error) {
    console.log("❌ path-to-regexp: ERROR -", error.message);
  }

  // Verificar express
  try {
    const express = require("express");
    const expressPath = "./node_modules/express/package.json";
    if (fs.existsSync(expressPath)) {
      const expressPkg = JSON.parse(fs.readFileSync(expressPath, "utf8"));
      console.log("✅ express: INSTALADO - Versión:", expressPkg.version);
    }
  } catch (error) {
    console.log("❌ express: ERROR -", error.message);
  }

  // Verificar socket.io
  try {
    const socketio = require("socket.io");
    const socketPath = "./node_modules/socket.io/package.json";
    if (fs.existsSync(socketPath)) {
      const socketPkg = JSON.parse(fs.readFileSync(socketPath, "utf8"));
      console.log("✅ socket.io: INSTALADO - Versión:", socketPkg.version);
    }
  } catch (error) {
    console.log("❌ socket.io: ERROR -", error.message);
  }

  console.log("\n🔍 VERIFICANDO CONFLICTOS:");

  // Buscar múltiples versiones de path-to-regexp
  const findPathToRegexp = (dir, level = 0) => {
    if (level > 3) return; // Evitar búsqueda demasiado profunda

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (item === "path-to-regexp" && fs.statSync(fullPath).isDirectory()) {
          const pkgPath = path.join(fullPath, "package.json");
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            console.log(
              `   Encontrado en: ${fullPath} - Versión: ${pkg.version}`
            );
          }
        } else if (
          item === "node_modules" &&
          fs.statSync(fullPath).isDirectory()
        ) {
          findPathToRegexp(fullPath, level + 1);
        }
      }
    } catch (error) {
      // Ignorar errores de permisos
    }
  };

  console.log("🔍 Buscando múltiples versiones de path-to-regexp:");
  findPathToRegexp("./node_modules");
} catch (error) {
  console.error("❌ Error leyendo package.json:", error.message);
}

console.log("\n💡 RECOMENDACIONES:");
console.log("1. Si path-to-regexp > 6.2.1: npm install path-to-regexp@6.2.1");
console.log(
  "2. Si hay múltiples versiones: rm -rf node_modules && npm install"
);
console.log("3. Si persiste: npm install express@4.18.2 socket.io@4.7.2");
