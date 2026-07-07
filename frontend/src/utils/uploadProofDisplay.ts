import { AlertCircle, XCircle } from 'lucide-react'
import type { CheckoutOrder } from '../types/order'

export const formatRemainingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const nextSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(nextSeconds).padStart(2, '0')}`
}

export const getUploadedProofMessage = (status: CheckoutOrder['status']) => {
  if (status === 'WAITING_CONFIRMATION') {
    return 'Pesanan sedang menunggu konfirmasi pembayaran dari admin.'
  }

  if (status === 'PROCESSING') {
    return 'Pembayaran sudah diverifikasi. Pesanan sedang diproses oleh cabang PanenMart.'
  }

  if (status === 'SHIPPED') {
    return 'Pembayaran sudah diverifikasi. Pesanan sedang dalam pengiriman.'
  }

  if (status === 'CONFIRMED') {
    return 'Pembayaran sudah diverifikasi dan pesanan sudah selesai.'
  }

  if (status === 'CANCELLED') {
    return 'Pesanan sudah dibatalkan. Bukti bayar tersimpan sebagai arsip transaksi.'
  }

  return 'Bukti pembayaran sudah tersimpan pada pesanan ini.'
}

export const getNoProofCopy = (order: CheckoutOrder) => {
  if (order.status === 'CANCELLED') {
    return {
      title: 'Pembayaran tidak dilanjutkan',
      description: order.cancelReason
        ? `Pesanan dibatalkan dengan alasan: ${order.cancelReason}`
        : 'Pesanan sudah dibatalkan sebelum bukti bayar diunggah.',
      Icon: XCircle,
    }
  }

  return {
    title: 'Bukti bayar tidak diperlukan',
    description: 'Pesanan tidak berada pada tahap unggah bukti bayar, sehingga tidak ada tindakan pembayaran manual yang diperlukan.',
    Icon: AlertCircle,
  }
}
