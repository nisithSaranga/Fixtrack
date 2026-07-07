const { db } = require('../config/firebaseConfig');
const { calculateDistance } = require('../utils/geolocation');

const findNearestMechanic = async (userLocation) => {
  const mechanicsSnapshot = await db.collection('users').where('role', '==', 'garage').get();
  let nearestMechanic = null;
  let minDistance = Infinity;

  mechanicsSnapshot.forEach(doc => {
    const mechanic = { id: doc.id, ...doc.data() };
    const distance = calculateDistance(userLocation, mechanic.location);
    if (distance < minDistance) {
      minDistance = distance;
      nearestMechanic = mechanic;
    }
  });

  return nearestMechanic;
};

const findAllNearestMechanics = async (userLocation) => {
  const mechanicsSnapshot = await db.collection('users').where('role', '==', 'garage').get();
  const nearbyMechanics = [];
  console.log('Garages Snapshot Size:', mechanicsSnapshot.size);
  mechanicsSnapshot.forEach(doc => {
    const mechanic = { id: doc.id, ...doc.data() };
    console.log('Garage Data:', JSON.stringify(mechanic));

    console.log(mechanic.garageLocation, userLocation);
    const distance = calculateDistance(userLocation, mechanic.garageLocation);
    console.log('Distance:', distance);
    if (distance <= 50) { // Assuming 50 km as the threshold for "nearby"
      nearbyMechanics.push({ ...mechanic, distance });
    }
  });

  return nearbyMechanics.sort((a, b) => a.distance - b.distance);
}

module.exports = { findNearestMechanic, findAllNearestMechanics };