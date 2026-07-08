import { formatDateTime } from '../../utils/format'

type CheckoutSuccessOrder = {
  paymentMethod: string
  paymentDeadline: string | null
}

export const getSuccessPaymentDescription = (paymentMethod: string) =>
  paymentMethod === 'MANUAL_TRANSFER'
    ? 'Unggah bukti pembayaran diperlukan sebelum admin memproses pesanan.'
    : 'Pembayaran online berhasil sehingga pesanan langsung masuk proses.'

export const getSuccessPaymentLabel = (paymentMethod: string) =>
  paymentMethod === 'MANUAL_TRANSFER' ? 'Transfer Manual' : 'Pembayaran Online'

export const getSuccessDeadline = (order: CheckoutSuccessOrder) =>
  order.paymentDeadline ? formatDateTime(order.paymentDeadline) : '-'
