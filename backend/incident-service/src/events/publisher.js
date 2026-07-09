const amqp = require('amqplib');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://onalert_guest:guest_password@localhost:5672';
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'onalert_events';

let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Declaramos un exchange de tipo 'topic'
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('✅ Conectado a RabbitMQ - Exchange listo');
  } catch (err) {
    console.error('❌ Error al conectar a RabbitMQ:', err);
    // Reintentar en 5 segundos si falla la conexión
    setTimeout(connectRabbitMQ, 5000);
  }
}

function publishEvent(routingKey, messageData) {
  if (!channel) {
    console.warn('⚠️ RabbitMQ canal no listo. Mensaje no enviado.');
    return false;
  }
  
  try {
    const buffer = Buffer.from(JSON.stringify(messageData));
    channel.publish(EXCHANGE_NAME, routingKey, buffer, { persistent: true });
    console.log(`✉️ Evento publicado en RabbitMQ con clave '${routingKey}'`);
    return true;
  } catch (err) {
    console.error('❌ Error al publicar en RabbitMQ:', err);
    return false;
  }
}

module.exports = {
  connectRabbitMQ,
  publishEvent
};
