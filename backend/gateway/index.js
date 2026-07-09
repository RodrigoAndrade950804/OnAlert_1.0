require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

// Rutas a través de los proxys
const gatewayRoutes = require('./src/routes/index');
app.use('/api', gatewayRoutes);

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
