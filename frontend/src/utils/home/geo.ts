import type { Coordinates, StoreLocation } from '../../types/home/home'

export type NearestStore = {
  store: StoreLocation
  distanceKm: number
}

const EARTH_RADIUS_KM = 6371

const toRadians = (value: number) => (value * Math.PI) / 180

export const getDistanceKm = (from: Coordinates, to: Coordinates) => {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(fromLat) * Math.cos(toLat)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

export const findNearestStore = (
  stores: StoreLocation[],
  coords: Coordinates,
): NearestStore | null => {
  if (!stores.length) {
    return null
  }

  let closest: NearestStore | null = null

  for (const store of stores) {
    const distanceKm = getDistanceKm(coords, {
      lat: store.lat,
      lng: store.lng,
    })

    if (!closest || distanceKm < closest.distanceKm) {
      closest = { store, distanceKm }
    }
  }

  return closest
}
