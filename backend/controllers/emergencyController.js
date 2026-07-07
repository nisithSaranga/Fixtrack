const { db, admin } = require('../config/firebaseConfig');
const twilioService = require('../services/twilioService');
const mechanicService = require('../services/mechanicService');

const createEmergency = async (req, res) => {
  const { location, description, userId, urgency, phoneNumber, vehicleId } = req.body;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userDoc.data();

    //const nearestMechanic = await mechanicService.findNearestMechanic(location);
    //if (!nearestMechanic) {
    //  return res.status(404).json({ message: 'No mechanics available' });
    //}

    const emergencyRef = await db.collection('emergencies').add({
      userId,
      location,
      description,
      vehicleId,
      urgency,
      phoneNumber,
      status: 'pending',
      assignedGarageId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify customer and mechanic via Twilio
    //await twilioService.notifyCustomer(user.phone, 'Your emergency request has been received.');
    //await twilioService.notifyMechanic(nearestMechanic.phone, `New emergency assigned: ${emergencyRef.id}`);

    res.status(201).json({ message: 'Emergency request created', emergencyId: emergencyRef.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllNearastGarages = async (req, res) => {
  const { location } = req.body;
  try {
    const garages = await mechanicService.findAllNearestMechanics(location);
    if (garages.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(garages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } 
};

//const assignGarageToEmergency = async (req, res) => {
//  const { emergencyId, garageId } = req.body;
//  try {
//    const emergencyDoc = await db.collection('emergencies').doc(emergencyId).get(); 
//    if (!emergencyDoc.exists) {
//      return res.status(404).json({ message: 'Emergency not found' });
//    }
//    await db.collection('emergencies').doc(emergencyId).update({
//      assignedGarageId: garageId,
//      status: 'assigned',
//    });
//    // Notify garage via Twilio
    
//    const garageDoc = await db.collection('garages').doc(garageId).get();
//    if (garageDoc.exists) {
//      const garage = garageDoc.data();
//      await twilioService.notifyGarage(garage.phone, `You have been assigned to emergency: ${emergencyId}`);
//    }
//    res.status(200).json({ message: 'Garage assigned to emergency', emergencyId });
//  } catch (error) {
//    res.status(500).json({ message: error.message });
//  }
//};

const assignGarageToEmergency = async (req, res) => {
  const { emergencyId, garageId } = req.body;

  try {
    // Get emergency data
    const emergencyRef = db.collection('emergencies').doc(emergencyId);
    const emergencyDoc = await emergencyRef.get();

    if (!emergencyDoc.exists) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const emergency = emergencyDoc.data();

    // Update emergency doc
    await emergencyRef.update({
      assignedGarageId: garageId,
      status: 'assigned',
    });

    // Notify the garage
    const garageDoc = await db.collection('users').doc(garageId).get();
    if (garageDoc.exists) {
      const garage = garageDoc.data();
      if (garage.phone) {
        await twilioService.notifyMechanic(
          garage.phone,
          `New emergency assigned!\nID: ${emergencyId}\nUrgency: ${emergency.urgency}\nLocation: (${emergency.location.latitude}, ${emergency.location.longitude})`
        );
      }
    }

    // Notify the client
    const clientDoc = await db.collection('users').doc(emergency.userId).get();
    if (clientDoc.exists) {
      const client = clientDoc.data();
      if (client.phone) {
        await twilioService.notifyCustomer(
          client.phone,
          `Your emergency request has been assigned to a garage. Garage ID: ${garageId}`
        );
      }
    }

    res.status(200).json({ message: 'Garage assigned to emergency and notifications sent', emergencyId });

  } catch (error) {
    console.error('Error in assignGarageToEmergency:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAllEmergencies = async (req, res) => {
  try {
    const emergenciesSnapshot = await db.collection('emergencies').get();
    const emergencies = emergenciesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmergencyById = async (req, res) => {
  const { id } = req.params;
  try {
    const emergencyDoc = await db.collection('emergencies').doc(id).get();
    if (!emergencyDoc.exists) {
      return res.status(200).json([]);
    }
    res.status(200).json({ id: emergencyDoc.id, ...emergencyDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmergenciesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const emergenciesSnapshot = await db.collection('emergencies')
      .where('userId', '==', userId)
      .get();
    
    const emergencies = emergenciesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmergenciesByGarageId = async (req, res) => {
  const { garageId } = req.params;
  try {
    const emergenciesSnapshot = await db.collection('emergencies')
      .where('assignedGarageId', '==', garageId)
      .get();
    if (emergenciesSnapshot.empty) {
      return res.status(200).json([]);
    }
    const emergencies = emergenciesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssignedVehiclesByGarageId = async (req, res) => {
  const { garageId } = req.params;
  try {
    const emergenciesSnapshot = await db.collection('emergencies')
      .where('assignedGarageId', '==', garageId)
      .get();
    if (emergenciesSnapshot.empty) {
      return res.status(200).json([]);
    }
    const vehiclesIds = emergenciesSnapshot.docs.map(doc => doc.data().vehicleId);
    const vehiclesPromises = vehiclesIds.map(vehicleId => db.collection('vehicles').doc(vehicleId).get());
    const vehiclesDocs = await Promise.all(vehiclesPromises);
    const vehicles = vehiclesDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmergenciesWithVehiclesByGarageId = async (req, res) => {
  const { garageId } = req.params;
  try {
    const emergenciesSnapshot = await db.collection('emergencies')
      .where('assignedGarageId', '==', garageId)
      .get();

    if (emergenciesSnapshot.empty) {
      return res.status(200).json([]);
    }

    const emergencies = emergenciesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const vehicleIds = emergencies.map(e => e.vehicleId);
    const vehicleFetchPromises = vehicleIds.map(id => db.collection('vehicles').doc(id).get());
    const vehicleDocs = await Promise.all(vehicleFetchPromises);

    const vehiclesMap = {};
    vehicleDocs.forEach(doc => {
      if (doc.exists) {
        vehiclesMap[doc.id] = { id: doc.id, ...doc.data() };
      }
    });

    const emergenciesWithVehicles = emergencies.map(e => ({
      ...e,
      vehicle: vehiclesMap[e.vehicleId] || null
    }));

    res.status(200).json(emergenciesWithVehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmergencyWithVehiclesById = async (req, res) => {
  const { id } = req.params;
  try {
    const emergencyDoc = await db.collection('emergencies').doc(id).get();
    if (!emergencyDoc.exists) {
      return res.status(404).json({ message: 'Emergency not found' });
    }
    const emergency = { id: emergencyDoc.id, ...emergencyDoc.data() };

    const vehicleDoc = await db.collection('vehicles').doc(emergency.vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    emergency.vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
    res.status(200).json(emergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
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
};