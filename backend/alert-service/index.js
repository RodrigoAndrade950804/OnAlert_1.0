const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const { AlertLog } = require('./mongoose');

const app = express();
const PORT = process.env.PORT || 8003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://onalert_guest:guest_password@localhost:5672';
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'onalert_events';

app.use(cors());
app.use(express.json());

// Listar historial de alertas enviadas (para auditoría de guardias/administración)
app.get('/api/alerts', async (req, res) => {
  const tenant_id = req.headers['x-tenant-id'];
  try {
    const alerts = await AlertLog.find({ tenant_id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor al obtener las alertas' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Alert Service' });
});

// Consumidor asíncrono RabbitMQ (Message Queue)
async function startRabbitMQConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Cola exclusiva para este microservicio
    const q = await channel.assertQueue('alert_processing_queue', { durable: true });
    
    // Vincular cola para escuchar cualquier evento de incidente (created, validated, etc.)
    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'incident.*');
    
    console.log('✅ Consumidor RabbitMQ registrado y escuchando eventos');

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(`📥 Alerta de mensajería recibida (Routing Key: ${routingKey})`);

        if (routingKey === 'incident.created') {
          // Lógica del microservicio: Simular despacho de notificaciones push
          console.log(`🔔 PROCESANDO ALERTA SOS CRÍTICA en segundo plano para: "${content.title}"`);
          
          // Generar una lista simulada de IDs de vecinos notificados (en un radio geográfico)
          const mockRecipients = ['user_vecino_104', 'user_vecino_882', 'user_vecino_501', 'user_vecino_024'];

          // Registrar en la base de datos de auditoría
          const log = new AlertLog({
            incident_id: content.id,
            title: content.title,
            recipient_list: mockRecipients,
            broadcast_status: 'enviado',
            tenant_id: content.tenant_id
          });
          await log.save();

          console.log(`📢 Notificación PUSH masiva despachada a ${mockRecipients.length} vecinos cercanos.`);
        }

        channel.ack(msg); // Confirmar mensaje procesado
      }
    });

  } catch (err) {
    console.error('❌ Error en el consumidor RabbitMQ:', err);
    setTimeout(startRabbitMQConsumer, 5000); // Reintentar en 5s
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servicio de Alertas corriendo en puerto ${PORT}`);
  startRabbitMQConsumer();
});
