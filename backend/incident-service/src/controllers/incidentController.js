const IncidentService = require('../services/IncidentService');

exports.createIncident = async (req, res) => {
  try {
    const incident = await IncidentService.createIncident(req.body, req.headers);
    res.status(201).json(incident);
  } catch (err) {
    console.error('[IncidentController - Create]', err.message);
    res.status(500).json({ error: 'Error en el servidor al registrar el incidente' });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const tenant_id = req.headers['x-tenant-id'];
    const incidents = await IncidentService.getIncidents(tenant_id, req.query);
    res.json(incidents);
  } catch (err) {
    console.error('[IncidentController - Get]', err.message);
    res.status(500).json({ error: 'Error en el servidor al obtener los incidentes' });
  }
};

exports.validateIncident = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    const incident = await IncidentService.validateIncident(req.params.id, req.body.status, userRole);
    res.json(incident);
  } catch (err) {
    console.error('[IncidentController - Validate]', err.message);
    let statusCode = 500;
    if (err.message.includes('permisos')) statusCode = 403;
    if (err.message.includes('inválido')) statusCode = 400;
    if (err.message.includes('encontrado')) statusCode = 404;
    res.status(statusCode).json({ error: err.message || 'Error al validar el incidente' });
  }
};

exports.confirmSafety = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const incident = await IncidentService.confirmSafety(req.params.id, req.body.userName, userId, userRole);
    res.json(incident);
  } catch (err) {
    console.error('[IncidentController - ConfirmSafety]', err.message);
    let statusCode = 500;
    if (err.message.includes('encontrado')) statusCode = 404;
    if (err.message.includes('permisos') || err.message.includes('Solo el creador')) statusCode = 403;
    if (err.message.includes('Ya has confirmado')) statusCode = 400;
    res.status(statusCode).json({ error: err.message || 'Error al guardar confirmación de seguridad' });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    await IncidentService.deleteIncident(req.params.id);
    res.json({ message: 'Incidente eliminado exitosamente', id: req.params.id });
  } catch (err) {
    console.error('[IncidentController - Delete]', err.message);
    const statusCode = err.message.includes('encontrado') ? 404 : 500;
    res.status(statusCode).json({ error: err.message || 'Error al eliminar incidente' });
  }
};
