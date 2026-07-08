import type { OrderStatus, PaymentMethod, Prisma } from '../../../generated/prisma/client'

export type DatabaseClient = Prisma.TransactionClient

export type CreateCheckoutOrderParams = {
  userId: number
  addressId: number
  shippingMethod: string
  shippingService: string
  shippingCost: number
  paymentMethod: PaymentMethod
  voucherId?: number
  notes?: string
  applyStoreDiscount?: boolean
}

export type CheckoutPreviewParams = {
  userId: number
  addressId?: number
}

export type CancelOrderParams = {
  userId: number
  orderId: number
  reason?: string
  isAdmin?: boolean
}

export type OrderPaymentParams = {
  userId: number
  orderId: number
}

export type OrderStatusGroup = 'ongoing' | 'completed' | 'cancelled'

export type ListOrdersParams = {
  userId: number
  page: number
  limit: number
  startDate?: string
  endDate?: string
  search?: string
  orderNumber?: string
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
}

export type ListAdminOrdersParams = Omit<ListOrdersParams, 'userId'> & {
  actorRole: string
  actorStoreId?: number | null
  storeId?: number
}

export type UploadPaymentProofParams = OrderPaymentParams & {
  paymentProofUrl: string
}

export type ConfirmManualPaymentParams = {
  userId: number
  orderId: number
  action: 'approve' | 'reject'
}

export type MidtransNotificationResult = {
  orderId: number
  orderNumber: string
  transactionStatus: string
  orderStatus: OrderStatus
} | null

export type MidtransTransactionStatus = {
  order_id: string
  transaction_status: string
  fraud_status?: string
  payment_type?: string
  transaction_id?: string
}
