console.log("=================================================");
console.log("🧹 GUÍA: CÓMO BORRAR EL CACHÉ LOCAL (WEB Y MOBILE)");
console.log("=================================================\n");

console.log("⚠️ AVISO IMPORTANTE:");
console.log("Un script de Node.js se ejecuta en tu computadora (servidor). Por seguridad de los sistemas operativos, un script no puede meterse a la fuerza al celular o al navegador web de un usuario a borrar sus datos.\n");

console.log("Sin embargo, tu aplicación YA BORRA los incidentes locales cada vez que la abres de forma automática (gracias a la función clearOfflineCache en el código).\n");

console.log("Si aún así necesitas hacer un borrado nuclear manual en tus pruebas, sigue estos pasos:\n");

console.log("📱 PARA MOBILE (EXPO GO):");
console.log("1. Abre la app de Expo Go en tu celular.");
console.log("2. En la pestaña 'Home', busca tu proyecto 'OnAlert'.");
console.log("3. Toca los 3 puntitos junto al nombre del proyecto.");
console.log("4. Selecciona 'Clear data'. (Si ya instalaste la APK, ve a Ajustes de Android -> Aplicaciones -> OnAlert -> Borrar Datos).\n");

console.log("🌐 PARA WEB (NAVEGADOR):");
console.log("1. Abre tu aplicación web en Chrome/Edge.");
console.log("2. Presiona F12 para abrir las Herramientas de Desarrollador.");
console.log("3. Ve a la pestaña 'Application' (Aplicación).");
console.log("4. En el panel izquierdo, despliega 'Local Storage' y selecciona tu URL (http://localhost:8081).");
console.log("5. Haz click derecho sobre la URL y selecciona 'Clear' (Borrar).");
console.log("6. Refresca la página con F5.\n");

console.log("=================================================");
console.log("💡 TIP: Para limpiar la NUBE (PostgreSQL y MongoDB) ejecuta 'node reset_db.js'.");
console.log("=================================================");
