const express = require('express');
const { 
  getServicesByGarageId, 
  getServiceById,
  getServicesByEmergencyId,
  getAllServices, 
  createService, 
  clientApproveService, 
  updatePaymentStatus, 
  updateServiceProgress, 
  getServicesByUserId, 
  clientRejectService 
} = require('../controllers/serviceController');
const router = express.Router();

router.get('/garage/:garageId', getServicesByGarageId);
router.get('/:serviceId', getServiceById);
router.get('/emergency/:emergencyId', getServicesByEmergencyId);
router.get('/', getAllServices);
router.get('/user/:userId', getServicesByUserId);
router.post('/', createService);
router.put('/approve/:serviceId', clientApproveService);
router.put('/reject/:serviceId', clientRejectService);
router.put('/payment/:serviceId', updatePaymentStatus);
router.put('/progress/:serviceId', updateServiceProgress);

module.exports = router;