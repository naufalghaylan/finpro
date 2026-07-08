import type { Cart } from './cart'
import type { DiscountType, PaymentMethod, OrderStatus } from './order-status.types'
import type { CheckoutVoucher, OrderVoucher } from './voucher.types'

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

export type CheckoutStoreDiscount = {
  id: number
  name: string
  productId: number | null
  discountType: DiscountType
  discountValue: number
  minPurchase: number
  maxDiscount: number | null
  startDate: string
  endDate: string
  amount: number
}

export type CheckoutPreview = {
  cart: Cart
  addresses: CheckoutAddress[]
  vouchers: CheckoutVoucher[]
  selectedAddress: CheckoutAddress | null
  nearestStore: CheckoutStore | null
  storeDiscounts: CheckoutStoreDiscount[]
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
  voucher: OrderVoucher | null
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
  voucherId?: number
  notes?: string
  applyStoreDiscount?: boolean
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
