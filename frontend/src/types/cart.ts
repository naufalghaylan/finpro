export type CartProductImage = {
  id: number
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
}

export type CartProductStock = {
  id: number
  quantity: number
  store?: {
    id: number
    name: string
    address: string
    city: string
  }
}

export type CartProductDiscount = {
  id: number
  discountType: 'PERCENTAGE' | 'NOMINAL' | 'BUY_ONE_GET_ONE'
  discountValue: number
  isActive: boolean
}

export type CartProduct = {
  id: number
  name: string
  slug: string
  basePrice: number
  weight: number
  category: {
    id: number
    name: string
    slug: string
  }
  images: CartProductImage[]
  stocks: CartProductStock[]
  discounts?: CartProductDiscount[]
  totalStock: number
}

export type CartItem = {
  id: number
  productId: number
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct
  lineTotal: number
  baseLineTotal?: number
  discountAmount?: number
}

export type CartSummary = {
  totalQuantity: number
  subtotal: number
  storeDiscountAmount?: number
  voucherReferralAmount?: number
  discountAmount?: number
  total?: number
}

export type Cart = {
  id: number | null
  store: {
    id: number
    name: string
    address: string
    city: string
  } | null
  items: CartItem[]
  summary: CartSummary
}

export type CartMutationResult = {
  cartItem?: {
    id: number
    productId: number
    quantity: number
    createdAt?: string
    updatedAt?: string
  }
  deletedItemId?: number
  cartCount: number
}
