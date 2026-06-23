import {
  CheckCircle2,
  Clock3,
  CreditCard,
  PackageCheck,
  ReceiptText,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatDateTime } from './orderDisplay'

type StatusInsightTone = 'pending' | 'review' | 'processing' | 'shipped' | 'completed' | 'cancelled'

type StatusInsight = {
  tone: StatusInsightTone
  Icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  items: string[]
}

const getPaymentMethodLabel = (order: CheckoutOrder) =>
  order.paymentMethod === 'MANUAL_TRANSFER' ? 'Transfer Manual' : 'Pembayaran Online'

const getPaymentDeadlineText = (order: CheckoutOrder) =>
  order.paymentDeadline ? `Batas bayar: ${formatDateTime(order.paymentDeadline)}` : 'Batas bayar belum tersedia'

const getStatusInsight = (order: CheckoutOrder): StatusInsight => {
  if (order.status === 'PENDING_PAYMENT') {
    const isManualTransfer = order.paymentMethod === 'MANUAL_TRANSFER'

    return {
      tone: 'pending',
      Icon: isManualTransfer ? ReceiptText : CreditCard,
      eyebrow: 'Menunggu Pembayaran',
      title: isManualTransfer ? 'Pembayaran menunggu bukti transfer' : 'Pembayaran online belum selesai',
      description: isManualTransfer
        ? 'Transfer sesuai total tagihan, lalu unggah bukti bayar sebelum batas waktu berakhir.'
        : 'Selesaikan pembayaran melalui Midtrans agar pesanan bisa masuk proses.',
      items: [
        `Metode: ${getPaymentMethodLabel(order)}`,
        getPaymentDeadlineText(order),
        isManualTransfer
          ? 'Pesanan diproses setelah bukti bayar diverifikasi.'
          : 'Status akan diperbarui otomatis setelah pembayaran berhasil.',
      ],
    }
  }

  if (order.status === 'WAITING_CONFIRMATION') {
    return {
      tone: 'review',
      Icon: Clock3,
      eyebrow: 'Menunggu Konfirmasi',
      title: 'Bukti bayar sedang ditinjau',
      description: 'Bukti pembayaran sudah tersimpan. Tim PanenMart sedang memeriksa pembayaran sebelum pesanan diproses.',
      items: [
        `Metode: ${getPaymentMethodLabel(order)}`,
        'Tidak perlu melakukan pembayaran ulang.',
        `Update terakhir: ${formatDateTime(order.updatedAt)}`,
      ],
    }
  }

  if (order.status === 'PROCESSING') {
    return {
      tone: 'processing',
      Icon: PackageCheck,
      eyebrow: 'Sedang Diproses',
      title: 'Pesanan sedang disiapkan',
      description: `Pembayaran sudah diterima. Cabang ${order.store.name} sedang menyiapkan produk sebelum dikirim.`,
      items: [
        'Pembayaran sudah diverifikasi.',
        `Cabang: ${order.store.name}`,
        `Update terakhir: ${formatDateTime(order.updatedAt)}`,
      ],
    }
  }

  if (order.status === 'SHIPPED') {
    return {
      tone: 'shipped',
      Icon: Truck,
      eyebrow: 'Sedang Dikirim',
      title: 'Pesanan dalam perjalanan',
      description: 'Pesanan sudah keluar dari cabang. Konfirmasi pesanan setelah semua item diterima dengan baik.',
      items: [
        order.shippedAt ? `Dikirim: ${formatDateTime(order.shippedAt)}` : 'Tanggal kirim belum tercatat',
        'Konfirmasi pesanan setelah semua item diterima.',
        'Cek kembali item sebelum menyelesaikan pesanan.',
      ],
    }
  }

  if (order.status === 'CONFIRMED') {
    return {
      tone: 'completed',
      Icon: CheckCircle2,
      eyebrow: 'Pesanan Selesai',
      title: 'Pesanan sudah selesai',
      description: 'Pesanan sudah dikonfirmasi diterima. Rincian pesanan dan pembayaran tetap tersimpan di halaman ini.',
      items: [
        order.confirmedAt ? `Selesai: ${formatDateTime(order.confirmedAt)}` : 'Tanggal selesai belum tercatat',
        `Metode: ${getPaymentMethodLabel(order)}`,
        'Tidak ada tindakan lanjutan yang diperlukan.',
      ],
    }
  }

  return {
    tone: 'cancelled',
    Icon: XCircle,
    eyebrow: 'Pesanan Dibatalkan',
    title: 'Pesanan ini tidak aktif',
    description: 'Pesanan sudah dibatalkan dan tidak akan diproses. Detail pembatalan bisa dilihat pada ringkasan pesanan.',
    items: [
      order.cancelledAt ? `Dibatalkan: ${formatDateTime(order.cancelledAt)}` : 'Tanggal pembatalan belum tercatat',
      order.cancelReason ? `Alasan: ${order.cancelReason}` : 'Alasan pembatalan tidak tercatat.',
      'Tidak ada pembayaran lanjutan yang diperlukan.',
    ],
  }
}

export function OrderStatusInsightPanel({ order }: { order: CheckoutOrder }) {
  const insight = getStatusInsight(order)
  const Icon = insight.Icon
  const DetailIcon = insight.tone === 'cancelled' ? XCircle : CheckCircle2

  return (
    <section className={`checkout-panel order-status-insight order-status-insight--${insight.tone}`}>
      <div className="order-status-insight-icon">
        <Icon aria-hidden="true" />
      </div>

      <div className="order-status-insight-copy">
        <span>{insight.eyebrow}</span>
        <h2>{insight.title}</h2>
        <p>{insight.description}</p>
      </div>

      <ul className="order-status-insight-list">
        {insight.items.map((item) => (
          <li key={item}>
            <DetailIcon aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}