# OnAlert - Sistema de Alertas Comunitarias 🚨

OnAlert es una plataforma integral (Frontend Web/Móvil y Backend de Microservicios) diseñada para gestionar incidentes de seguridad y emergencias vecinales (SOS). Soporta arquitectura multi-inquilino (múltiples comunidades) y características avanzadas como WebSockets para chat en tiempo real y arquitectura de red híbrida (Nube/P2P Mesh).

---

## 🚀 Arquitectura del Proyecto

El proyecto está dividido en tres componentes principales:

1. **`shared/`**: Paquete NPM local que contiene modelos, tipos de TypeScript y lógica compartida (relojes lógicos de Lamport, algoritmos de sincronización de tiempo, P2P).
2. **`backend/`**: Arquitectura orientada a microservicios:
   - **API Gateway** (Puerto 8000): Enrutamiento general y WebSockets.
   - **User Service** (Puerto 8001): Gestión de usuarios, autenticación (JWT) y Tenant. Base de datos: **PostgreSQL**.
   - **Incident Service** (Puerto 8002): Gestión de incidentes (Geoespacial). Base de datos: **MongoDB**.
   - **Alert Service** (Puerto 8003): Historial y procesamiento de notificaciones.
   - **RabbitMQ**: (Puerto 5672) Broker de mensajería para comunicación asíncrona entre microservicios.
3. **`frontend/`**: Aplicación multiplataforma construida con **Expo (React Native)**. Funciona en Web, Android e iOS.

---

## 📋 Requisitos Previos

Para ejecutar este proyecto en tu entorno de desarrollo, asegúrate de tener instaladas las siguientes herramientas:

1. **[Node.js](https://nodejs.org/)** (Versión 18 o superior)
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Requerido para levantar las bases de datos y el servidor de mensajería de forma automática)

> **Nota para Windows**: Asegúrate de que Docker Desktop esté corriendo y que WSL2 (Windows Subsystem for Linux) esté habilitado en tu sistema.

---

## 🛠️ Instalación y Configuración Paso a Paso

Sigue estos pasos estrictamente en este orden para levantar el proyecto sin errores.

### Paso 1: Levantar Infraestructura con Docker (Bases de datos y RabbitMQ)

El proyecto incluye un archivo `docker-compose.yml` ya configurado dentro de la carpeta `backend` que levantará **PostgreSQL**, **MongoDB** y **RabbitMQ** automáticamente con los puertos y credenciales correctos.

1. Abre una terminal.
2. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```
3. Ejecuta el comando para iniciar los contenedores en segundo plano:
   ```bash
   docker-compose up -d
   ```
4. Espera un par de minutos a que Docker descargue las imágenes e inicie los contenedores.
   > *Esto levantará PostgreSQL en el puerto `5433`, MongoDB en `27017` y RabbitMQ en `5672`.*

---

### Paso 2: Compilar el Módulo Compartido (`shared`)

El frontend y el backend dependen de código compartido (tipos, utilidades de red, relojes lógicos). **Si omites este paso, tanto el frontend como el backend fallarán al arrancar.**

1. Abre una terminal en la raíz del proyecto.
2. Navega a la carpeta `shared`:
   ```bash
   cd shared
   ```
3. Instala las dependencias y compila el código:
   ```bash
   npm install
   npm run build
   ```
4. Vuelve a la carpeta raíz del proyecto:
   ```bash
   cd ..
   ```

---

### Paso 3: Instalar y Levantar el Backend (Microservicios)

El backend utiliza la herramienta `concurrently` para ejecutar todos los microservicios (Gateway, User, Incident, Alert) a la vez desde un solo comando.

1. Abre una terminal en la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias globales del backend:
   ```bash
   npm install
   ```
3. Inicia todos los microservicios:
   ```bash
   npm start
   ```
4. En tu consola deberías ver registros (logs) confirmando que cada servicio se ha conectado correctamente a PostgreSQL, MongoDB y RabbitMQ.
   > **Nota**: No cierres esta terminal. El backend debe seguir corriendo.

---

### Paso 4: Instalar y Levantar el Frontend (Expo)

Finalmente, levanta la interfaz gráfica. Puedes usar tu navegador web o la app Expo Go en tu dispositivo móvil.

1. Abre una **nueva ventana** de terminal y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias del frontend:
   ```bash
   npm install
   ```
3. Levanta la aplicación:
   - **Para usar la aplicación en el Navegador Web (Recomendado para pruebas rápidas)**:
     ```bash
     npm run web
     ```
     La app se abrirá automáticamente en `http://localhost:8081`.
     
   - **Para probar en el Celular**:
     ```bash
     npx expo start
     ```
     Descarga la app "Expo Go" en tu teléfono (iOS o Android) y escanea el código QR que aparece en la consola. 

---

## 👤 ¿Cómo empezar a usar la plataforma?

Una vez que tengas la aplicación web abierta en tu pantalla, sigue este flujo básico para entender cómo funciona la plataforma:

1. **Crear una Comunidad y un Usuario**:
   - Haz clic en "Registrarse".
   - Rellena los datos. Cuando escribas el nombre de la "Comunidad" (por ejemplo: `MiBarrio`), el sistema creará automáticamente un Inquilino (Tenant) para aislar los datos.
   - Selecciona el rol `vecino`.

2. **Tipos de Roles**:
   - **Vecino (`vecino`)**: Inicia sesión en la app, puede reportar incidentes, emitir alertas SOS instantáneas (Nube o Red Mesh P2P si está sin conexión), y chatear con los involucrados.
   - **Administrador Local (`admin`)**: Tiene un panel de control para ver las métricas de su comunidad, gestionar (aprobar/cerrar) incidentes y administrar a los vecinos de su Tenant.
   - **Policía / UPC (`policia_upc`)**: Interfaz exclusiva para autoridades. Pueden aceptar casos, marcar que están "En Camino" y comunicarse directamente por el chat del incidente.
   > *Nota: Para obtener los roles `admin` o `policia_upc`, puedes registrar nuevos usuarios en la interfaz y luego actualizar su rol directamente en la base de datos PostgreSQL, en la tabla `users`.*

3. **Demostración de Emergencia (SOS)**:
   - Inicia sesión como **Vecino**.
   - Presiona el botón rojo grande de **BOTÓN DE EMERGENCIA (SOS)**.
   - La alerta se despachará en tiempo real al servidor y entrarás a la sala del incidente.
   - Abre **otra pestaña o ventana de incógnito** e inicia sesión con una cuenta que tenga rol de **UPC**.
   - En el panel de la UPC, verás la alerta sonar y titilar en rojo. Haz clic en ella.
   - Presiona el botón amarillo **"En camino / Recibido"**.
   - Vuelve a la pantalla del **Vecino**. Verás cómo el estado cambió a "En progreso" y un mensaje automático de la policía aparecerá en el Chat de Emergencia.

---

## 🏗️ Patrones y Tecnologías Principales

- **Arquitectura Microservicios**: Backend escalable separado por dominios (Users, Incidents, Alerts).
- **Multitenancy**: Aislamiento lógico de datos para que la Comunidad A no vea los incidentes de la Comunidad B.
- **Event-Driven (RabbitMQ)**: Comunicación asíncrona robusta.
- **Relojes Lógicos de Lamport**: Empleados para mantener el orden cronológico de eventos incluso en entornos desconectados (Mesh P2P).
- **WebSockets (Socket.io)**: Comunicación en tiempo real (Chat y Notificaciones push) con actualizaciones dinámicas del UI (Zero-refresh).

---
*Hecho con ❤️ para la seguridad de todos los vecindarios.*