import * as Location from 'expo-location';

export const metersBetween = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const ensureInsideGeofence = async (targetLat: number, targetLon: number, radiusMeters: number) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const dist = metersBetween(location.coords.latitude, location.coords.longitude, targetLat, targetLon);
  if (dist > radiusMeters) {
    throw new Error(`Outside geofence (${Math.round(dist)}m > ${radiusMeters}m).`);
  }
  return { distance: dist, coords: location.coords };
};
