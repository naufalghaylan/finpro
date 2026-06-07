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
}

export type CartSummary = {
  totalQuantity: number
  subtotal: number
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
