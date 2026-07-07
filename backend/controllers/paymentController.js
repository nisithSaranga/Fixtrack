const { db, admin } = require('../config/firebaseConfig');

const getPaymentsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const paymentsSnapshot = await db.collection('payments')
      .where('clientId', '==', userId)
      .get();
    if (paymentsSnapshot.empty) {
      return res.status(200).json([]);
    }
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;
  try {
    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    await paymentRef.update({
      paymentStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const serviceId = paymentDoc.data().serviceId;
    await updatePaymentStatusInService(serviceId, status);
    res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatusFunction = async (paymentId, status) => {
  try {
    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();
    if (!paymentDoc.exists) {
      throw new Error('Payment not found');
    }
    await paymentRef.update({
      paymentStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const serviceId = paymentDoc.data().serviceId;
    await updatePaymentStatusInService(serviceId, status);
  } catch (error) {
    console.error('Error updating payment status:', error);
  } 
};

const updatePaymentStatusInService = async (serviceId, status) => {
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    await serviceRef.update({
      paymentStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating payment status in service:', error);
  }
};

module.exports = { getPaymentsByUser, updatePaymentStatus, updatePaymentStatusFunction};