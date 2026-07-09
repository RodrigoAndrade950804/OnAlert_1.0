const Incident = require('../models/Incident');
const { publishEvent } = require('../events/publisher');

class IncidentService {
  static getSeverityByType(type) {
    const highSeverityTypes = ['sos', 'robo', 'violencia', 'incendio', 'medica'];
    if (highSeverityTypes.includes(type.toLowerCase())) {
      return 'alta';
    }
    return 'media';
  }

  static async createIncident(data, headers) {
    const { type, title, description, location, media_urls, lamport_timestamp } = data;
    const reporter_id = headers['x-user-id'];
    const reporter_name = data.reporter_name || 'Vecino Anónimo';
    const tenant_id = headers['x-tenant-id'];

    if (!type || !title || !location || !location.coordinates) {
      throw new Error('Faltan campos obligatorios para registrar el incidente');
    }

    const severity = this.getSeverityByType(type);

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

    return incident;
  }

  static async getIncidents(tenant_id, queryParams) {
    const { longitude, latitude, radius } = queryParams;
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

    return await Incident.find(query).sort({ createdAt: -1 }).limit(100);
  }

  static async validateIncident(id, status, userRole) {
    const roleUpper = userRole ? userRole.toUpperCase() : '';
    if (roleUpper !== 'ADMIN' && roleUpper !== 'GUARDIA' && roleUpper !== 'POLICIA_UPC') {
      throw new Error('No tienes permisos de administrador/guardia/policía para validar reportes');
    }

    if (!['validado', 'rechazado', 'atendido', 'cerrado', 'en_progreso'].includes(status)) {
      throw new Error('Estado de validación inválido');
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      throw new Error('Incidente no encontrado');
    }

    incident.status = status;
    await incident.save();

    publishEvent('incident.validated', {
      id: incident._id,
      status: incident.status,
      tenant_id: incident.tenant_id
    });

    return incident;
  }

  static async confirmSafety(id, userName, userId, userRole) {
    const incident = await Incident.findById(id);
    if (!incident) {
      throw new Error('Incidente no encontrado');
    }

    const roleUpper = userRole ? userRole.toUpperCase() : '';
    if (userId !== incident.reporter_id && roleUpper !== 'ADMIN') {
      throw new Error('Solo el creador o el administrador pueden confirmar seguridad');
    }

    const alreadyConfirmed = incident.safetyConfirmations.some(c => c.userId === userId);
    if (alreadyConfirmed) {
      throw new Error('Ya has confirmado tu seguridad para este incidente');
    }

    incident.safetyConfirmations.push({
      userId,
      userName: userName || 'Vecino',
      confirmedAt: new Date()
    });

    if (userId === incident.reporter_id) {
      incident.status = 'cerrado';
    }

    await incident.save();

    if (userId === incident.reporter_id) {
      publishEvent('incident.validated', {
        id: incident._id,
        status: incident.status,
        tenant_id: incident.tenant_id
      });
    }

    return incident;
  }

  static async deleteIncident(id) {
    const deleted = await Incident.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error('Incidente no encontrado');
    }
    return deleted;
  }
}

module.exports = IncidentService;
