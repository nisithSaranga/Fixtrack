const express = require('express');
const { getVehicleDetails, addVehicle, getVehiclesByUser, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/byId/:vehicleId', getVehicleDetails);
router.get('/byuserId/:uid', getVehiclesByUser); 
router.post('/', addVehicle);
router.put('/:vehicleId', updateVehicle);
router.delete('/:vehicleId', deleteVehicle);

module.exports = router;