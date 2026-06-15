import type { Cart } from './cart'

export type PaymentMethod = 'MANUAL_TRANSFER' | 'PAYMENT_GATEWAY'
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_CONFIRMATION'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'CONFIRMED'
  | 'CANCELLED'
export type OrderStatusGroup = 'ongoing' | 'completed' | 'cancelled'

export type CheckoutAddress = {
  id: number
  recipientName: string
  phone: string
  address: string
  city: string
  province: string
  district: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  isPrimary: boolean
  createdAt?: string
  updatedAt?: string
}

export type CheckoutStore = {
  id: number
  name: string
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
  serviceRadius: number
  distance: number
  isOutOfRange: boolean
}

export type CheckoutPaymentMethod = {
  value: PaymentMethod
  label: string
  description: string
}

export type CheckoutPreview = {
  cart: Cart
  addresses: CheckoutAddress[]
  selectedAddress: CheckoutAddress | null
  nearestStore: CheckoutStore | null
  paymentMethods: CheckoutPaymentMethod[]
}

export type CheckoutOrderItem = {
  id: number
  quantity: number
  priceAtTime: number
  subtotal: number
  product: {
    id: number
    name: string
    slug: string
    images: {
      id: number
      imageUrl: string
      isPrimary: boolean
      sortOrder: number
    }[]
  }
}

export type CheckoutOrder = {
  id: number
  orderNumber: string
  status: OrderStatus
  totalProductAmount: number
  totalAmount: number
  shippingCost: number
  discountAmount: number
  paymentMethod: PaymentMethod
  paymentProof: string | null
  paymentGatewayId: string | null
  paymentDeadline: string | null
  shippedAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  store: Omit<CheckoutStore, 'distance' | 'isOutOfRange'>
  address: CheckoutAddress
  items: CheckoutOrderItem[]
}

export type CreateCheckoutOrderPayload = {
  addressId: number
  shippingMethod: string
  shippingService: string
  shippingCost: number
  paymentMethod: PaymentMethod
  notes?: string
}

export type CreateCheckoutOrderResult = {
  order: CheckoutOrder
  nearestStore: CheckoutStore
  cartCount: number
}

export type CreateMidtransPaymentResult = {
  orderId: number
  orderNumber: string
  snapToken: string
  redirectUrl: string | null
}

export type OrderListQuery = {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  orderNumber?: string
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
}

export type AdminOrderListQuery = OrderListQuery & {
  storeId?: number
}

export type OrderListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type OrderListResponse = {
  orders: CheckoutOrder[]
  meta: OrderListMeta
}

export type AdminOrder = CheckoutOrder & {
  shippingMethod: string | null
  shippingService: string | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
}

export type AdminOrderListResponse = {
  orders: AdminOrder[]
  meta: OrderListMeta
}
