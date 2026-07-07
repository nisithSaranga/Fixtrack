const e=require('express');
const { db, admin } = require('../config/firebaseConfig');
const {get}=require('../routes/serviceRoutes');

const getServicesByGarageId = async (req, res) => {
  const { garageId } = req.params;
  try {
    const servicesSnapshot = await db.collection('services')
      .where('garageId', '==', garageId)
      .get();
    
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } 
};

const getServiceById = async (req, res) => {
  const { serviceId } = req.params;
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    
    res.status(200).json({ id: serviceDoc.id, ...serviceDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServicesByEmergencyId = async (req, res) => {
  const { emergencyId } = req.params;
  try {
    const servicesSnapshot = await db.collection('services')
      .where('emergencyId', '==', emergencyId)
      .get();
    if (servicesSnapshot.empty) {
      return res.status(404).json({ message: 'No services found for this emergency' });
    }
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const servicesSnapshot = await db.collection('services').get();
    
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createService = async (req, res) => {
  const { emergencyId, estimatedTime, description, garageId, estimatedCost } = req.body;
  console.log( emergencyId, estimatedTime, description, garageId, estimatedCost );
  try {
    const serviceRef = db.collection('services').doc();
    await serviceRef.set({
      garageId,
      emergencyId,
      description,
      estimatedCost,
      clientStatus: 'pending', // Status can be 'pending', 'approved', 'rejected'
      isClientApproved: false,
      paymentStatus: 'pending',
      progress: [{ status: 'pending', statusDescription: 'Service is pending' }],
      estimatedTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: 'Service created successfully', serviceId: serviceRef.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clientApproveService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const serviceData = serviceDoc.data();

    // Fetch emergency details
    const emergencyRef = db.collection('emergencies').doc(serviceData.emergencyId);
    const emergencyDoc = await emergencyRef.get();

    if (!emergencyDoc.exists) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const emergencyData = emergencyDoc.data();

    // Fetch vehicle details
    const vehicleRef = db.collection('vehicles').doc(emergencyData.vehicleId);
    const vehicleDoc = await vehicleRef.get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const vehicleData = vehicleDoc.data();

    // Build payment object
    const payment = {
      cost: Number(serviceData.estimatedCost), // Convert string to number
      serviceId: serviceId,
      garageId: serviceData.garageId,
      emergencyId: serviceData.emergencyId,
      clientId: emergencyData.userId,
      vehicle: `${vehicleData.make} ${vehicleData.model} ${vehicleData.year}`,
      paymentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create payment
    await db.collection('payments').add(payment);

    // Update service status
    await serviceRef.update({
      isClientApproved: true,
      clientStatus: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: 'Service approved and payment created successfully' });
  } catch (error) {
    console.error("Error approving service:", error);
    res.status(500).json({ message: error.message });
  }
};


const clientRejectService = async (req, res) => {
  const { serviceId } = req.params;
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await serviceRef.update({
      isClientApproved: false,
      clientStatus: 'rejected',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: 'Service rejected by client successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  const { serviceId } = req.params;
  const { paymentStatus } = req.body;
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await serviceRef.update({
      paymentStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const updateServiceProgress = async (req, res) => {
  const { serviceId } = req.params;
  const { status, statusDescription } = req.body;
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const timestamp = admin.firestore.Timestamp.now();
    
    const progressUpdate = {
      status,
      statusDescription,
      updatedAt: timestamp,
    };
    await serviceRef.update({ 
      progress: admin.firestore.FieldValue.arrayUnion(progressUpdate),
      updatedAt: timestamp,
    });
    res.status(200).json({ message: 'Service progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServicesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const emergenciesSnapshot = await db.collection('emergencies')
      .where('userId', '==', userId)
      .get();
    if (emergenciesSnapshot.empty) {
      return res.status(200).json([]);
    }
    const emergencyIds = emergenciesSnapshot.docs.map(doc => doc.id);
    const servicesSnapshot = await db.collection('services')
      .where('emergencyId', 'in', emergencyIds)
      .get();
    if (servicesSnapshot.empty) {
      return res.status(200).json([]);
    }
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
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
};