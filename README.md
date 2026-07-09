# 🚨 OnAlert - Sistema Distribuido de Alertas Comunitarias

OnAlert es una plataforma distribuida híbrida (Cloud + P2P Mesh + Edge Computing) diseñada para la gestión inmediata de situaciones de emergencia y coordinación vecinal en tiempo real. 

Este repositorio integra la aplicación móvil desarrollada en **React Native / Expo** y una infraestructura de microservicios robusta en la nube.

---

## 📂 Archivos del Proyecto (Limpieza de Boilerplate)

Se ha realizado una limpieza del código eliminando archivos de plantilla innecesarios (como `App.tsx` y `CLAUDE.md`, ya que Expo Router utiliza `app/index.tsx` de forma nativa). Los archivos principales de la arquitectura distribuida son:

*   `backend/`: Infraestructura de servidores y bases de datos en contenedores.
*   `services/p2pNode.ts`: Gestor local de la red Mesh descentralizada y consensos lógicos.
*   `application/usecases/`: Casos de uso de arquitectura limpia (`ActivateEmergencyButton`, `ReportIncident`, `SyncOfflineData`).
*   `utils/lamportClock.ts` & `timeSync.ts`: Sincronización lógica de eventos (Lamport) y marcas de tiempo duales (NTP).
*   `utils/namingService.ts`: Servicio de nombres jerárquico tipo DNS y lógica de enrutamiento DHT.

---

## 🗄️ Guía Paso a Paso para la Creación de la Base de Datos

Una de las grandes ventajas de esta arquitectura es que **la base de datos se crea de forma completamente automática**. No necesitas instalar PostgreSQL o MongoDB localmente en tu sistema operativo, ni ejecutar scripts manuales SQL para estructurar tablas. **Docker y Sequelize se encargan de todo.**

### Requisitos Previos:
1.  **Node.js** (versión 18 o superior).
2.  **Docker Desktop** (esencial para levantar las bases de datos y colas en contenedores).

---

### Paso 1: Levantar las Bases de Datos y RabbitMQ (Docker)
1.  Asegúrate de que **Docker Desktop** esté abierto y ejecutándose en segundo plano.
2.  Abre una terminal en tu computadora y navega a la carpeta del backend:
    ```bash
    cd c:\Users\Asus\Downloads\OnAlert\backend
    ```
3.  Ejecuta el siguiente comando para descargar y levantar PostgreSQL, MongoDB y RabbitMQ automáticamente:
    ```bash
    docker-compose up -d
    ```
    *Esto descargará las imágenes de base de datos necesarias y las ejecutará de forma aislada exponiendo los puertos requeridos (`5432` para Postgres, `27017` para Mongo y `5672` para RabbitMQ).*

---

### Paso 2: Creación Automática del Esquema de Datos (Auto-Migración)
Al iniciar los microservicios, el ORM **Sequelize** y la librería **Mongoose** detectarán las bases de datos vacías y estructurarán automáticamente el esquema:
1.  En la misma terminal dentro de `backend/`, ejecuta el script concurrente para levantar todos los microservicios:
    ```bash
    npm run start
    ```
2.  Durante el arranque, verás los siguientes registros en tu consola:
    *   `✅ Base de datos PostgreSQL sincronizada`: **Sequelize** creó automáticamente las tablas `users`, `tenants` y `user_tenants` en PostgreSQL.
    *   `✅ Conectado a MongoDB`: **Mongoose** se conectó a MongoDB y aplicó el índice geoespacial de alto rendimiento `2dsphere` sobre la ubicación del mapa.
    *   `✅ Conectado a RabbitMQ - Exchange listo`: El broker de mensajería asíncrona está listo para encolar alertas.

---

## 📱 Ejecución de la Aplicación Móvil (Expo)

Una vez que el backend está corriendo en los puertos locales:

1.  Abre otra ventana de terminal en la raíz del proyecto (`c:\Users\Asus\Downloads\OnAlert`).
2.  Inicia el servidor Metro Bundler de Expo:
    ```bash
    npm run start
    ```
3.  **Probar en Web (Navegador):** Presiona `w` en tu consola. Se abrirá `http://localhost:8081` con una simulación interactiva completa de mapas y del botón SOS lista para depurar.
4.  **Probar en Celular (Expo Go):** Escanea el código QR desde la app Expo Go (Android) o la cámara (iOS). Asegúrate de que tu celular y tu PC estén en la misma red Wi-Fi.

---

## 🧪 Demostración de Conceptos Distribuidos ante Profesores

Usa el botón de conmutación de red en el header de la app (**"En Nube" / "Mesh P2P"**) para probar:
*   **Modo Online ("En Nube"):** Las alertas se registran inmediatamente en MongoDB mediante el API Gateway. Puedes abrir los logs del contenedor de RabbitMQ (`http://localhost:15672` con credenciales `onalert_guest`/`guest_password`) para mostrar cómo se encolan y procesan las notificaciones asíncronamente en background.
*   **Modo Offline ("Mesh P2P"):** Las alertas se guardan en el storage del dispositivo firmadas con el **Reloj Lógico de Lamport** actual. Si simulas al menos 3 nodos conectados localmente, el Super Peer (Guardia) ejecutará el algoritmo de **Consenso Cruzado** para validar el evento de forma descentralizada.
*   **Sincronización:** Al volver a presionar el botón a **"En Nube"**, el dispositivo enviará automáticamente los reportes acumulados offline resolviendo el orden causal del historial.