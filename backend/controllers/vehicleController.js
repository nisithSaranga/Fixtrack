const { db } = require('../config/firebaseConfig');

const getVehicleDetails = async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicleDoc.data());
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVehiclesByUser = async (req, res) => {
  const userId = req.params.uid;
  console.log(userId)
  try {
    const vehiclesSnapshot = await db.collection('vehicles').where('userId', '==', userId).get();
    
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addVehicle = async (req, res) => {
  const { make, model, year, licensePlate, color, vin, userId } = req.body;
  try {
    const vehicleRef = await db.collection('vehicles').add({
      make,
      model,
      year,
      licensePlate,
      color,
      vin,
      userId,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ id: vehicleRef.id, message: 'Vehicle added successfully' });
  } catch (error) {
    console.error("Vehicle API Error:", error);
    res.status(500).json({ message: error.message });
  } 
};

const updateVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  const { make, model, year, licensePlate, color, vin } = req.body;
  try {
    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    await vehicleRef.update({
      make,
      model,
      year,
      licensePlate,
      color,
      vin,
      updatedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  try {
    await db.collection('vehicles').doc(vehicleId).delete();
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVehicleDetails, getVehiclesByUser, addVehicle, updateVehicle, deleteVehicle };