const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 8001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'User Service' });
});

// Sincronizar Base de Datos y levantar servidor
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Base de datos PostgreSQL sincronizada');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servicio de Usuarios corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error al sincronizar base de datos PostgreSQL:', err);
});
