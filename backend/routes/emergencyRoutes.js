const express = require('express');
const { 
  createEmergency, 
  getAllEmergencies, 
  getEmergencyById, 
  getAllNearastGarages, 
  assignGarageToEmergency,
  getEmergenciesByUserId,
  getEmergenciesByGarageId,
  getAssignedVehiclesByGarageId,
  getEmergenciesWithVehiclesByGarageId,
  getEmergencyWithVehiclesById
  } = require('../controllers/emergencyController');
const authMiddleware = require('../middleware/authMiddleware');
const { notifyCustomer } = require('../services/twilioService')
const router = express.Router();

router.post('/create', createEmergency);
router.get('/', getAllEmergencies);
router.get('/:id', getEmergencyById);
router.post('/garages/nearby', getAllNearastGarages);
router.post('/assign', assignGarageToEmergency);
router.get('/user/:userId', getEmergenciesByUserId);
router.get('/garage/:garageId', getEmergenciesByGarageId);
router.get('/garage/:garageId/vehicles', getAssignedVehiclesByGarageId);
router.get('/garage/:garageId/emergencies', getEmergenciesWithVehiclesByGarageId);
router.get('/vehicles/:id', getEmergencyWithVehiclesById);
router.post('/send-msg', async (req, res) => {
  const { message, phone } = req.body;
  try {
    await notifyCustomer(phone, message);
    res.status(200).json({ message: 'SMS sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send SMS', error: error.message });
  }
});

module.exports = router;