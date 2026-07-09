import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  ReceiptText,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { CheckoutOrder, OrderStatus } from '../../types/order'
import {
  formatCompactDateTime,
  formatCurrency,
  formatDateTime,
} from '../../utils/format'

type OrderStatusDisplay = {
  label: string
  className: string
  Icon: LucideIcon
}

export const orderStatusDisplay: Record<OrderStatus, OrderStatusDisplay> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    className: 'pending',
    Icon: Clock3,
  },
  WAITING_CONFIRMATION: {
    label: 'Menunggu Konfirmasi',
    className: 'waiting',
    Icon: ReceiptText,
  },
  PROCESSING: {
    label: 'Diproses',
    className: 'processing',
    Icon: PackageCheck,
  },
  SHIPPED: {
    label: 'Dikirim',
    className: 'shipped',
    Icon: Truck,
  },
  CONFIRMED: {
    label: 'Selesai',
    className: 'confirmed',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'cancelled',
    Icon: XCircle,
  },
}

export { formatCurrency, formatDateTime }

export const formatTrackingDateTime = formatCompactDateTime

export const getPrimaryOrderImage = (order: CheckoutOrder) => {
  const itemWithImage = order.items.find((item) => item.product.images.length > 0)
  if (!itemWithImage) return null

  return (
    itemWithImage.product.images.find((image) => image.isPrimary) ??
    itemWithImage.product.images[0]
  )
}

export const getOrderItemsSummary = (order: CheckoutOrder) => {
  const productNames = order.items.slice(0, 2).map((item) => item.product.name)
  const remainingCount = Math.max(order.items.length - productNames.length, 0)

  if (productNames.length === 0) return 'Tidak ada produk'

  return remainingCount > 0
    ? `${productNames.join(', ')} dan ${remainingCount} produk lain`
    : productNames.join(', ')
}

export const getOrderItemQuantity = (order: CheckoutOrder) =>
  order.items.reduce((sum, item) => sum + item.quantity, 0)

export const getOrderDiscountSummary = (order: CheckoutOrder) => {
  const discountAmount = Math.max(0, order.discountAmount ?? 0)

  return {
    discountAmount,
    discountLabel: order.voucher ? 'Diskon & Voucher' : 'Diskon',
  }
}

export const canCancelOrder = (order: CheckoutOrder) =>
  order.status === 'PENDING_PAYMENT' && !order.paymentProof

export const getUploadUrl = (url: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}${url}`
}
