const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

router.post('/', incidentController.createIncident);
router.get('/', incidentController.getIncidents);
router.post('/:id/validate', incidentController.validateIncident);
router.post('/:id/confirm', incidentController.confirmSafety);
router.delete('/:id', incidentController.deleteIncident);

module.exports = router;
