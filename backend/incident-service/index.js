const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { connectRabbitMQ } = require('./rabbitmq');
const incidentRoutes = require('./src/routes/incidentRoutes');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Base de Datos
connectDB();

// Rutas (MVC)
app.use('/api/incidents', incidentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Incident Service' });
});

// Conectar RabbitMQ y arrancar servidor
connectRabbitMQ().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servicio de Incidentes corriendo en puerto ${PORT}`);
  });
});
