const express = require('express');
const cors = require('cors');
const { Incident } = require('./mongoose');
const { connectRabbitMQ, publishEvent } = require('./rabbitmq');

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Helper para determinar severidad por tipo de incidente (sección 3.2 PDF)
const getSeverityByType = (type) => {
  const highSeverityTypes = ['sos', 'robo', 'violencia', 'incendio', 'medica'];
  if (highSeverityTypes.includes(type.toLowerCase())) {
    return 'alta';
  }
  return 'media';
};

// Crear Incidente (SOS o Reporte regular)
app.post('/api/incidents', async (req, res) => {
  const { type, title, description, location, media_urls, lamport_timestamp } = req.body;
  
  // Encabezados inyectados por el API Gateway
  const reporter_id = req.headers['x-user-id'];
  const reporter_name = req.body.reporter_name || 'Vecino Anónimo';
  const tenant_id = req.headers['x-tenant-id'];

  if (!type || !title || !location || !location.coordinates) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el incidente' });
  }

  try {
    // Determinar severidad
    const severity = getSeverityByType(type);

    // Crear modelo de Mongoose
    const incident = new Incident({
      reporter_id,
      reporter_name,
      type,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [location.coordinates[0], location.coordinates[1]] // [long, lat]
      },
      status: 'activo',
      media_urls: media_urls || [],
      severity,
      tenant_id,
      lamport_timestamp: lamport_timestamp || 0
    });

    await incident.save();

    // Publicar evento en RabbitMQ (Buzón de Mensajes)
    publishEvent('incident.created', {
      id: incident._id,
      type: incident.type,
      title: incident.title,
      reporter_name: incident.reporter_name,
      location: incident.location.coordinates,
      severity: incident.severity,
      tenant_id: incident.tenant_id,
      lamport_timestamp: incident.lamport_timestamp,
      createdAt: incident.createdAt
    });

    res.status(201).json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor al registrar el incidente' });
  }
});

// Listar Incidentes (Soporta consultas geoespaciales y filtrado multi-inquilino)
app.get('/api/incidents', async (req, res) => {
  const tenant_id = req.headers['x-tenant-id'];
  const { longitude, latitude, radius } = req.query; // Radio en metros

  try {
    let query = { tenant_id };

    // Si se pasan coordenadas de geolocalización, hacemos búsqueda por cercanía
    if (longitude && latitude) {
      const long = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const rad = radius ? parseFloat(radius) : 2000; // default 2km

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [long, lat]
          },
          $maxDistance: rad
        }
      };
    }

    const incidents = await Incident.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(incidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor al obtener los incidentes' });
  }
});

// Validar Incidente (Acciones del Dashboard Administrador/Guardia)
app.post('/api/incidents/:id/validate', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'validado' o 'rechazado'
  const userRole = req.headers['x-user-role'];

  if (userRole !== 'ADMIN' && userRole !== 'GUARDIA') {
    return res.status(403).json({ error: 'No tienes permisos de administrador/guardia para validar reportes' });
  }

  if (!['validado', 'rechazado'].includes(status)) {
    return res.status(400).json({ error: 'Estado de validación inválido' });
  }

  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    incident.status = status;
    await incident.save();

    // Publicar evento de validación en RabbitMQ
    publishEvent('incident.validated', {
      id: incident._id,
      status: incident.status,
      tenant_id: incident.tenant_id
    });

    res.json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al validar el incidente' });
  }
});

// Confirmación de Seguridad ("Estoy Bien" de vecinos, HU-06)
app.post('/api/incidents/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;
  const userId = req.headers['x-user-id'];

  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    // Evitar duplicados
    const alreadyConfirmed = incident.safetyConfirmations.some(c => c.userId === userId);
    if (alreadyConfirmed) {
      return res.status(400).json({ error: 'Ya has confirmado tu seguridad para este incidente' });
    }

    incident.safetyConfirmations.push({
      userId,
      userName: userName || 'Vecino',
      confirmedAt: new Date()
    });

    await incident.save();
    res.json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar confirmación de seguridad' });
  }
});

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
