import type { CheckoutAddress } from '../../types/order'

export const getAddressLine = (address: CheckoutAddress) =>
  [address.district, address.city, address.province, address.postalCode].filter(Boolean).join(', ')

export const hasAddressCoordinates = (address: CheckoutAddress) =>
  address.latitude !== null && address.longitude !== null

export const getCoordinateClassName = (address: CheckoutAddress) =>
  hasAddressCoordinates(address) ? 'checkout-coordinate-ok' : 'checkout-coordinate-missing'

export const getCoordinateLabel = (address: CheckoutAddress) =>
  hasAddressCoordinates(address) ? 'Koordinat tersedia' : 'Koordinat belum tersedia'
