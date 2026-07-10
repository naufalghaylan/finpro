import type { UserAddress } from '../../types/address'
import type { Cart, CartItem } from '../../types/cart'

export type CartCoords = { lat: number; lng: number } | null

export type CartItemView = CartItem & {
  displayQuantity: number
  displayUnitPrice: number
  displayLineTotal: number
}

export type CartPageSummary = {
  totalQuantity: number
  subtotal: number
  discount: number
  total: number
}

const getDisplayUnitPrice = (item: CartItem) =>
  item.quantity > 0 ? item.lineTotal / item.quantity : item.product.basePrice

const getDisplayQuantity = (item: CartItem, drafts: Record<number, string>) => {
  const draft = drafts[item.id]
  if (draft === undefined || draft === '') return item.quantity

  const quantity = Number(draft)
  if (!Number.isInteger(quantity) || quantity <= 0) return item.quantity
  if (item.product.totalStock > 0 && quantity > item.product.totalStock) return item.quantity

  return quantity
}

export const getCartDisplayItems = (cart: Cart, quantityDrafts: Record<number, string>): CartItemView[] =>
  cart.items.map((item) => {
    const displayQuantity = getDisplayQuantity(item, quantityDrafts)
    const displayUnitPrice = getDisplayUnitPrice(item)

    return {
      ...item,
      displayQuantity,
      displayUnitPrice,
      displayLineTotal: displayQuantity * displayUnitPrice,
    }
  })

export const getCartPageSummary = (items: CartItemView[]): CartPageSummary =>
  items.reduce(
    (summary, item) => {
      const originalLineTotal = item.displayQuantity * item.product.basePrice
      return {
        totalQuantity: summary.totalQuantity + item.displayQuantity,
        subtotal: summary.subtotal + originalLineTotal,
        discount: summary.discount + (originalLineTotal - item.displayLineTotal),
        total: summary.total + item.displayLineTotal,
      }
    },
    { totalQuantity: 0, subtotal: 0, discount: 0, total: 0 },
  )

export const getSelectedCartAddress = (
  addresses: UserAddress[],
  selectedAddressId: number | null,
) => {
  const selected = selectedAddressId != null ? addresses.find((address) => address.id === selectedAddressId) : null
  return selected ?? addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null
}

export const getCartCoords = (
  isAuthenticated: boolean,
  address: UserAddress | null,
  fallbackCoords: CartCoords,
): CartCoords => {
  if (!isAuthenticated) return null
  if (address?.latitude != null && address?.longitude != null) {
    return { lat: address.latitude, lng: address.longitude }
  }
  return fallbackCoords
}

export const getFulfillmentBranch = (cart: Cart) =>
  cart.store?.name ?? (cart.store?.city ? `Cabang ${cart.store.city}` : 'cabang terdekat')
