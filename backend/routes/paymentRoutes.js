const express = require('express');
const { getPaymentsByUser, updatePaymentStatus } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

//router.post('/create', createPayment);
router.get('/user/:userId', getPaymentsByUser);
router.put('/update/:paymentId', updatePaymentStatus);

module.exports = router;