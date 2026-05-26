import prisma from '../lib/prisma';

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getNearestStoreService = async (lat: number, lng: number) => {
  const stores = await prisma.store.findMany({
    where: { status: true }
  });

  if (!stores || stores.length === 0) {
    return null;
  }

  let nearestStore = stores[0];
  let minDistance = getDistanceFromLatLonInKm(lat, lng, nearestStore.latitude, nearestStore.longitude);

  for (let i = 1; i < stores.length; i++) {
    const store = stores[i];
    const distance = getDistanceFromLatLonInKm(lat, lng, store.latitude, store.longitude);
    if (distance < minDistance) {
      nearestStore = store;
      minDistance = distance;
    }
  }

  const isOutOfRange = minDistance > nearestStore.serviceRadius;

  return {
    ...nearestStore,
    distance: minDistance,
    isOutOfRange
  };
};
