const express = require('express');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const INCIDENT_SERVICE_URL = process.env.INCIDENT_SERVICE_URL || 'http://localhost:8002';
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8003';

// Middleware de Autenticación
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado o inválido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adjuntamos info del token descifrado (id, rol, tenant_id)
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Rutas Públicas de Auth
router.use('/auth', proxy(USER_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`
}));

// Rutas Protegidas de Incidentes
router.use('/incidents', authenticateJWT, proxy(INCIDENT_SERVICE_URL, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Inyectamos los datos del JWT decodificado en las cabeceras HTTP para los microservicios
    proxyReqOpts.headers['X-User-Id'] = srcReq.user.sub;
    proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
    proxyReqOpts.headers['X-Tenant-Id'] = srcReq.user.tenant_id;
    return proxyReqOpts;
  },
  proxyReqPathResolver: (req) => `/api/incidents${req.url}`
}));

// Rutas Protegidas de Alertas (Historial y Notificaciones)
router.use('/alerts', authenticateJWT, proxy(ALERT_SERVICE_URL, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['X-User-Id'] = srcReq.user.sub;
    proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
    proxyReqOpts.headers['X-Tenant-Id'] = srcReq.user.tenant_id;
    return proxyReqOpts;
  },
  proxyReqPathResolver: (req) => `/api/alerts${req.url}`
}));

module.exports = router;
