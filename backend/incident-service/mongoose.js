const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onalert_incidents';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB');
}).catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err);
});

const IncidentSchema = new mongoose.Schema({
  reporter_id: { type: String, required: true },
  reporter_name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. 'sos', 'robo', 'incendio'
  title: { type: String, required: true },
  description: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['activo', 'validado', 'rechazado', 'cerrado', 'atendido'],
    default: 'activo'
  },
  media_urls: { type: [String], default: [] },
  severity: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  tenant_id: { type: String, required: true }, // Lógica multi-tenant
  lamport_timestamp: { type: Number, default: 0 }, // Reloj lógico de Lamport
  safetyConfirmations: [{
    userId: String,
    userName: String,
    confirmedAt: Date
  }]
}, {
  timestamps: true // crea createdAt y updatedAt automáticamente
});

// Crear índice geoespacial de 2dsphere
IncidentSchema.index({ location: '2dsphere' });

const Incident = mongoose.model('Incident', IncidentSchema);

module.exports = { mongoose, Incident };
