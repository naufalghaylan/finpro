import type { CartItem } from '../types/cart'

export type CartItemAvailability = {
  activeStoreStock: number | null
  blocksCheckout: boolean
  fulfilledFromOtherBranch: boolean
  isListedInFulfillmentStore: boolean
  lowStock: boolean
  message: string
  quantityExceedsStock: boolean
  stockUnavailable: boolean
}

export const getCartItemAvailability = (
  item: CartItem,
  quantity = item.quantity,
): CartItemAvailability => {
  const isListedInFulfillmentStore = item.product.isListedInFulfillmentStore !== false
  const activeStoreStock = item.product.activeStoreStock ?? null
  const stockUnavailable = item.product.totalStock <= 0
  const quantityExceedsStock = item.product.totalStock > 0 && quantity > item.product.totalStock
  const fulfilledFromOtherBranch = Boolean(
    isListedInFulfillmentStore &&
      !stockUnavailable &&
      activeStoreStock !== null &&
      activeStoreStock <= 0,
  )
  const comparableStock = activeStoreStock ?? item.product.totalStock
  const lowStock = Boolean(
    isListedInFulfillmentStore &&
      !stockUnavailable &&
      !quantityExceedsStock &&
      !fulfilledFromOtherBranch &&
      comparableStock > 0 &&
      comparableStock <= 2,
  )
  const blocksCheckout = !isListedInFulfillmentStore || stockUnavailable || quantityExceedsStock

  let message = `${item.product.totalStock} stok tersedia`
  if (!isListedInFulfillmentStore) {
    message = 'Tidak dijual di cabang ini'
  } else if (stockUnavailable) {
    message = 'Stok habis'
  } else if (quantityExceedsStock) {
    message = `Stok tersedia hanya ${item.product.totalStock}`
  } else if (fulfilledFromOtherBranch) {
    message = 'Dipenuhi dari cabang lain'
  } else if (activeStoreStock !== null) {
    message = lowStock ? `Stok cabang sisa ${activeStoreStock}` : `${activeStoreStock} stok di cabang ini`
  }

  return {
    activeStoreStock,
    blocksCheckout,
    fulfilledFromOtherBranch,
    isListedInFulfillmentStore,
    lowStock,
    message,
    quantityExceedsStock,
    stockUnavailable,
  }
}

export const getCartBlockingReason = (items: CartItem[]) => {
  if (items.some((item) => !getCartItemAvailability(item).isListedInFulfillmentStore)) {
    return 'Ada produk yang tidak dijual di cabang pemrosesan. Pilih cabang/alamat lain atau hapus produk tersebut.'
  }

  if (items.some((item) => getCartItemAvailability(item).stockUnavailable)) {
    return 'Ada produk yang stoknya habis. Hapus produk tersebut sebelum checkout.'
  }

  if (items.some((item) => getCartItemAvailability(item).quantityExceedsStock)) {
    return 'Ada jumlah produk yang melebihi stok tersedia. Kurangi jumlahnya sebelum checkout.'
  }

  return null
}