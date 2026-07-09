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

## 🌍 Despliegue Público Gratuito (Ngrok + Vercel)

Para exponer el sistema a internet sin pagar servidores en la nube para el backend (ideal para presentaciones universitarias o defensas de tesis), utilizaremos **ngrok** (que crea un túnel seguro a tu computadora) para el backend y **Vercel** para el frontend web.

### ⚠️ IMPORTANTE: ¿Qué pasa cuando cambio de WiFi (Ej: al llegar a la Universidad)?
Cada vez que apagues tu computadora, cierres ngrok, o cambies de red WiFi, **ngrok te generará una nueva URL pública**. Esto significa que tu backend cambiará de "dirección en internet".
Cuando esto pase, simplemente debes:
1. Volver a correr `ngrok http 8000` y copiar la **nueva** URL.
2. Ir a Vercel (Settings -> Environment Variables) y actualizar el valor de `EXPO_PUBLIC_API_URL` con la nueva URL.
3. Ir a la pestaña "Deployments" en Vercel y hacer un **Redeploy**. ¡En 2 minutos volverá a funcionar!

### 1. Levantar el Backend Localmente
Asegúrate de que tu base de datos (Docker) y los microservicios del backend (Gateway en el puerto 8000) estén corriendo en tu máquina local.

### 2. Exponer el Backend al mundo con ngrok
1. Descarga **ngrok** desde la **Microsoft Store** (es más fácil porque lo añade al PATH automáticamente).
2. Ve a [ngrok.com](https://ngrok.com/), regístrate/inicia sesión, y en tu panel de control busca la sección **"Your Authtoken"**.
3. Abre una terminal (Símbolo del sistema o PowerShell) y pega el comando de autenticación para vincular tu PC con tu cuenta. Se ve así:
   `ngrok config add-authtoken 1a2b3c4d5e...` *(Esto se hace solo la primera vez)*.
4. En esa misma terminal (o en una nueva), ejecuta el comando para abrir el túnel hacia tu API Gateway:
   ```bash
   ngrok http 8000
   ```
5. En el panel que aparece, busca la línea **Forwarding** y **copia la URL HTTPS** (Ej: `https://abcd-123.ngrok-free.app`). ¡Ese es tu backend en la nube! (No cierres esta terminal).

### 3. Conectar y Desplegar el Frontend en Vercel
1. Asegúrate de hacer un `git push` de todo tu proyecto a tu repositorio de **GitHub**.
2. Entra a [vercel.com](https://vercel.com/) (inicia sesión con GitHub) y haz clic en **Add New -> Project**.
3. Busca tu repositorio de OnAlert y haz clic en **Import**.
4. En la pantalla de configuración ("Configure Project"), haz los siguientes ajustes exactos:
   - **Root Directory**: Haz clic en Edit. Asegúrate de que esté **vacío** (es decir, apuntando a la raíz del proyecto monorepo, *NO pongas `frontend`*).
   - **Build and Output Settings**: Despliega esta sección, enciende los interruptores (overrides) y escribe:
     - *Build Command*: `npm run build -w @onalert/shared && cd frontend && npx expo export`
     - *Output Directory*: `frontend/dist`
   - **Environment Variables**:
     - *Name (Key)*: `EXPO_PUBLIC_API_URL`
     - *Value*: Pega aquí tu **URL de ngrok** (`https://abcd-123.ngrok-free.app`).
     - Haz clic en **Add**.
5. Haz clic en el botón negro **Deploy**. Vercel compilará la app y te dará un enlace público (tipo `.vercel.app`).
6. **¡Listo!** Abre el enlace de Vercel desde tu celular (con datos móviles) y verás cómo tu app se conecta mágicamente a la computadora de tu casa.

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

- **Arquitectura Microservicios**: Backend escalable separado por dominios (Users, Incidents, Alerts, Gateway).
- **Multitenancy**: Aislamiento lógico de datos para que la Comunidad A no vea los incidentes de la Comunidad B.
- **Event-Driven (RabbitMQ)**: Comunicación asíncrona robusta que actúa como un "Buzón Salvavidas".
- **Relojes Lógicos de Lamport**: Empleados para mantener el orden cronológico causal de eventos incluso en entornos desconectados (Mesh P2P), complementando a los Relojes Físicos (NTP).
- **WebSockets (Socket.io)**: Comunicación en tiempo real (Chat y Notificaciones push) con actualizaciones dinámicas del UI (Zero-refresh).

---

## 🛡️ Defensa del Proyecto: Enfoque de Sistema Distribuido y Design Sprint

Este proyecto no es solo una aplicación, es una **arquitectura híbrida revolucionaria** nacida de la aplicación de metodologías ágiles (Design Sprint) para resolver problemas críticos de la vida real (apagones, inseguridad y saturación de información).

### 1. El Problema (Design Sprint: Entender y Definir)
Durante la fase de empatía y definición, identificamos **El Caos** (saturación en grupos de chat), **El Riesgo** (reacciones descoordinadas por información asimétrica) y **El Dato Crítico**: *los sistemas tradicionales fallan durante apagones por su 100% de dependencia de internet*.

### 2. Los Actores (Personas)
La solución fue diseñada centrada en el usuario, dividiendo las responsabilidades para evitar cuellos de botella:
- **El Vecino / Residente:** Actúa como *Edge Node* (Nodo Periférico). Es el generador de alertas inmediatas (SOS en < 2 segundos).
- **El Guardia / Administrador (UPC):** Actúa como validador y gestor operativo. Filtra el ruido y coordina la mitigación.
- **La Comunidad:** La red P2P subyacente que propaga información verificada.

### 3. La Solución Técnica: Arquitectura Distribuida Híbrida
En lugar de elegir un **Modelo Centralizado** (que colapsa sin internet) o un **Modelo P2P Puro** (que es inmanejable y difícil de auditar), ideamos un **Modelo Híbrido**:
* **Gestión Global (Cloud):** Operaciones asíncronas, historial inmutable en bases de datos distribuidas (MongoDB/PostgreSQL) y despliegue sin interrupciones (Zero Downtime usando Docker).
* **Supervivencia Local (Edge & P2P):** Si la nube falla, los smartphones actúan como *Super Peers* retransmitiendo la alerta localmente.

### 4. Teorema CAP y Consistencia Eventual
Alineados al **Teorema CAP**, frente a particiones de red (ej. cortes de energía), OnAlert prioriza la **Disponibilidad** (A). Garantizamos que el grito de auxilio (SOS) llegue a los vecinos inmediatamente, aceptando una **Consistencia Eventual** en la base de datos central.

### 5. Transparencia y Resiliencia
- **Transparencia de Enrutamiento (El Efecto Mágico):** El usuario percibe una app normal de un solo botón. Por debajo, el sistema intercepta la alerta y decide si enviarla vía Cloud API (Online) o vía Mesh (Offline), ocultando toda la complejidad técnica.
- **Tolerancia a Fallos (Microservicios):** Al estar desacoplado en 4 microservicios (Gateway, Usuarios, Incidentes, Alertas) conectados por un bus de mensajes (RabbitMQ), garantizamos que *si el chat colapsa, las alertas SOS siguen operando intactas*.

---
*Hecho con ❤️ para la seguridad de todos los vecindarios.*