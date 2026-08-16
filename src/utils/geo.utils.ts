// Haversine formula to calculate the distance between two points on the Earth
export const distanceMetres = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in metres
};

export const isWithinGeofence = (
  studentLat: number,
  studentLon: number,
  centerLat: number,
  centerLon: number,
  radiusM: number
): boolean => {
  const distance = distanceMetres(studentLat, studentLon, centerLat, centerLon);
  return distance <= radiusM;
};
