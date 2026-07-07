const calculateDistance = (loc1, loc2) => {
  const toRadians = degrees => (degrees * Math.PI) / 180;

  const R = 6371; // Radius of Earth in kilometers
  const lat1 = toRadians(parseFloat(loc1.latitude));
  const lon1 = toRadians(parseFloat(loc1.longitude));
  const lat2 = toRadians(parseFloat(loc2.latitude));
  const lon2 = toRadians(parseFloat(loc2.longitude));

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
};

module.exports = { calculateDistance };
