const Incident = require('../models/Incident');
const { publishEvent } = require('../../rabbitmq');

const getSeverityByType = (type) => {
  const highSeverityTypes = ['sos', 'robo', 'violencia', 'incendio', 'medica'];
  if (highSeverityTypes.includes(type.toLowerCase())) {
    return 'alta';
  }
  return 'media';
};

exports.createIncident = async (req, res) => {
  const { type, title, description, location, media_urls, lamport_timestamp } = req.body;
  const reporter_id = req.headers['x-user-id'];
  const reporter_name = req.body.reporter_name || 'Vecino Anónimo';
  const tenant_id = req.headers['x-tenant-id'];

  if (!type || !title || !location || !location.coordinates) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el incidente' });
  }

  try {
    const severity = getSeverityByType(type);

    const incident = new Incident({
      reporter_id,
      reporter_name,
      type,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [location.coordinates[0], location.coordinates[1]]
      },
      status: 'activo',
      media_urls: media_urls || [],
      severity,
      tenant_id,
      lamport_timestamp: lamport_timestamp || 0
    });

    await incident.save();

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
};

exports.getIncidents = async (req, res) => {
  const tenant_id = req.headers['x-tenant-id'];
  const { longitude, latitude, radius } = req.query;

  try {
    let query = { tenant_id };

    if (longitude && latitude) {
      const long = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const rad = radius ? parseFloat(radius) : 2000;

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
};

exports.validateIncident = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userRole = req.headers['x-user-role'];

  if (userRole !== 'ADMIN' && userRole !== 'GUARDIA' && userRole !== 'POLICIA_UPC') {
    return res.status(403).json({ error: 'No tienes permisos de administrador/guardia/policía para validar reportes' });
  }

  if (!['validado', 'rechazado', 'atendido', 'cerrado', 'en_progreso'].includes(status)) {
    return res.status(400).json({ error: 'Estado de validación inválido' });
  }

  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    incident.status = status;
    await incident.save();

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
};

exports.confirmSafety = async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    if (userId !== incident.reporter_id && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo el creador o el administrador pueden confirmar seguridad' });
    }

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
};

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Incident.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }
    res.json({ message: 'Incidente eliminado exitosamente', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar incidente' });
  }
};
