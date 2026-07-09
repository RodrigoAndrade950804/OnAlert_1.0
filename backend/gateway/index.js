require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const INCIDENT_SERVICE_URL = process.env.INCIDENT_SERVICE_URL || 'http://localhost:8002';
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8003';

app.use(cors());

// Middleware de Autenticación
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado o inválido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adjuntamos info del token descifrado (id, rol, tenant_id)
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Rutas Públicas de Auth
app.use('/api/auth', proxy(USER_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return `/api/auth${req.url}`;
  }
}));

// Rutas Protegidas de Incidentes
app.use('/api/incidents', authenticateJWT, proxy(INCIDENT_SERVICE_URL, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Inyectamos los datos del JWT decodificado en las cabeceras HTTP para los microservicios
    proxyReqOpts.headers['X-User-Id'] = srcReq.user.sub;
    proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
    proxyReqOpts.headers['X-Tenant-Id'] = srcReq.user.tenant_id;
    return proxyReqOpts;
  },
  proxyReqPathResolver: (req) => {
    return `/api/incidents${req.url}`;
  }
}));

// Rutas Protegidas de Alertas (Historial y Notificaciones)
app.use('/api/alerts', authenticateJWT, proxy(ALERT_SERVICE_URL, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['X-User-Id'] = srcReq.user.sub;
    proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
    proxyReqOpts.headers['X-Tenant-Id'] = srcReq.user.tenant_id;
    return proxyReqOpts;
  },
  proxyReqPathResolver: (req) => {
    return `/api/alerts${req.url}`;
  }
}));

const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const { setupSocketIO } = require('./src/sockets/chatSocket');
setupSocketIO(io);
// Consumidor asíncrono RabbitMQ para el Gateway (Bridge a WebSockets)
async function startRabbitMQBridge() {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://onalert_guest:guest_password@localhost:5672';
  const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'onalert_events';
  
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Cola volátil exclusiva para el Gateway WebSocket
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'incident.*');
    
    console.log('✅ Gateway conectado a RabbitMQ. Listo para despachar PUSH WebSockets.');

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        
        // Emitir a la sala del Tenant (Comunidad) correspondiente
        if (content.tenant_id) {
          io.to(content.tenant_id).emit('new_incident_event', {
            type: routingKey,
            data: content
          });
        }
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('❌ Error en el puente RabbitMQ del Gateway:', err);
    setTimeout(startRabbitMQBridge, 5000);
  }
}

// Servidor de Estado / Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'API Gateway with WebSockets' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway y WebSockets corriendo en puerto ${PORT}`);
  startRabbitMQBridge();
});
