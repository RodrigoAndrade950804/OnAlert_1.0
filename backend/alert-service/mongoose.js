const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onalert_alerts';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Alertas MongoDB conectado');
}).catch(err => {
  console.error('❌ Error al conectar Alertas MongoDB:', err);
});

const AlertLogSchema = new mongoose.Schema({
  incident_id: { type: String, required: true },
  title: { type: String, required: true },
  recipient_list: { type: [String], default: [] }, // Array de IDs de vecinos notificados
  broadcast_status: { type: String, enum: ['enviado', 'recibido'], default: 'enviado' },
  tenant_id: { type: String, required: true }
}, {
  timestamps: true
});

const AlertLog = mongoose.model('AlertLog', AlertLogSchema);

module.exports = { mongoose, AlertLog };
