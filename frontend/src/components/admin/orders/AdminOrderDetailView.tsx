import { useState } from 'react'
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  PackageCheck,
  ReceiptText,
  Send,
  Truck,
  UserRound,
} from 'lucide-react'
import { getOrderItemQuantity, getUploadUrl, orderStatusDisplay } from '../../orders/orderDisplay'
import type { AdminOrder, MutationStatus, OrderStatus } from '../../../types/order'
import { formatCurrency, formatDateTime } from '../../../utils/format'

type AdminOrderDetailViewProps = {
  order: AdminOrder
  onBack: () => void
  onReviewPayment: () => void
  onCancelOrder: () => void
  onManageFulfillment: () => void
  onShipOrder: () => void
}

const paymentMethodLabel: Record<AdminOrder['paymentMethod'], string> = {
  MANUAL_TRANSFER: 'Manual Transfer',
  PAYMENT_GATEWAY: 'Payment Gateway',
}

const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-admin-amber-soft text-admin-amber',
  WAITING_CONFIRMATION: 'bg-admin-blue-soft text-admin-blue',
  PROCESSING: 'bg-admin-green-soft text-admin-green',
  SHIPPED: 'bg-admin-blue-soft text-admin-blue',
  CONFIRMED: 'bg-admin-green-soft text-admin-green',
  CANCELLED: 'bg-admin-red-soft text-admin-red',
}

const mutationStatusLabel: Record<MutationStatus, string> = {
  PENDING: 'Menunggu Approval',
  APPROVED: 'Disetujui',
  IN_TRANSIT: 'Dalam Pengiriman',
  COMPLETED: 'Diterima',
  REJECTED: 'Ditolak',
}

const mutationStatusClass: Record<MutationStatus, string> = {
  PENDING: 'bg-admin-amber-soft text-admin-amber',
  APPROVED: 'bg-admin-blue-soft text-admin-blue',
  IN_TRANSIT: 'bg-admin-blue-soft text-admin-blue',
  COMPLETED: 'bg-admin-green-soft text-admin-green',
  REJECTED: 'bg-admin-red-soft text-admin-red',
}

const canAdminCancelOrder = (order: AdminOrder) =>
  !['SHIPPED', 'CONFIRMED', 'CANCELLED'].includes(order.status)

const hasActiveFulfillment = (order: AdminOrder) =>
  order.stockMutations.some((mutation) => ['PENDING', 'IN_TRANSIT'].includes(mutation.status))

const getAddressLine = (order: AdminOrder) =>
  [
    order.address.address,
    order.address.district,
    order.address.city,
    order.address.province,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(', ')

export function AdminOrderDetailView({
  order,
  onBack,
  onReviewPayment,
  onCancelOrder,
  onManageFulfillment,
  onShipOrder,
}: AdminOrderDetailViewProps) {
  const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false)
  const statusMeta = orderStatusDisplay[order.status]
  const StatusIcon = statusMeta.Icon
  const paymentProofUrl = getUploadUrl(order.paymentProof)
  const canReviewPayment =
    order.paymentMethod === 'MANUAL_TRANSFER' &&
    order.status === 'WAITING_CONFIRMATION' &&
    Boolean(order.paymentProof)
  const canCancel = canAdminCancelOrder(order)
  const canManageFulfillment = order.status === 'PROCESSING'
  const fulfillmentInProgress = hasActiveFulfillment(order)
  const canShowActions = canReviewPayment || canManageFulfillment || canCancel

  return (
    <div className="admin-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                       text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                       hover:bg-admin-surface-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke daftar pesanan
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-admin-accent-strong m-0 mt-5">
            Detail Pesanan
          </p>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <h3 className="text-xl font-bold text-admin-ink m-0">{order.orderNumber}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass[order.status]}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-admin-ink-muted m-0 mt-1">
            Dibuat {formatDateTime(order.createdAt)} oleh {order.user.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptText className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Produk Dibeli</h4>
            </div>

            <div className="flex flex-col gap-3">
              {order.items.map((item) => {
                const image = item.product.images.find((productImage) => productImage.isPrimary) ?? item.product.images[0]
                const imageUrl = image ? getUploadUrl(image.imageUrl) : ''

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[56px_1fr_auto] gap-3 items-center rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-admin-surface overflow-hidden flex items-center justify-center text-xs text-admin-ink-muted">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        'Produk'
                      )}
                    </div>
                    <div>
                      <strong className="block text-sm text-admin-ink">{item.product.name}</strong>
                      <span className="block text-xs text-admin-ink-muted mt-1">
                        {item.quantity} x {formatCurrency(item.priceAtTime)}
                      </span>
                    </div>
                    <strong className="text-sm text-admin-ink text-right">{formatCurrency(item.subtotal)}</strong>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Alamat Pembeli</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
                  Penerima
                </span>
                <strong className="block text-admin-ink">{order.address.recipientName}</strong>
                <span className="block text-admin-ink-soft mt-1">{order.address.phone}</span>
              </div>
              <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
                  Akun
                </span>
                <strong className="block text-admin-ink">{order.user.name}</strong>
                <span className="inline-flex items-center gap-1.5 text-admin-ink-soft mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {order.user.email}
                </span>
                {order.user.phone && (
                  <span className="block text-admin-ink-soft mt-1">{order.user.phone}</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4 mt-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
                Alamat Lengkap
              </span>
              <p className="text-sm text-admin-ink-soft leading-relaxed m-0">{getAddressLine(order)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Fulfillment</h4>
            </div>

            {order.stockMutations.length === 0 ? (
              <p className="text-sm text-admin-ink-muted m-0">Belum ada request fulfillment untuk pesanan ini.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {order.stockMutations.map((mutation) => (
                  <div key={mutation.id} className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block text-sm text-admin-ink">{mutation.product.name}</strong>
                        <span className="block text-xs text-admin-ink-muted mt-1">
                          {mutation.sourceStore.name} ke {mutation.destinationStore.name}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${mutationStatusClass[mutation.status]}`}>
                        {mutationStatusLabel[mutation.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                      <div>
                        <span className="block text-admin-ink-muted">Quantity</span>
                        <strong className="text-admin-ink">{mutation.quantity}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Dibuat</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.createdAt)}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Dikirim</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.sentAt)}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Diterima</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.receivedAt)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Pembayaran</h4>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-admin-ink-muted">Metode</span>
                <strong className="text-admin-ink">{paymentMethodLabel[order.paymentMethod]}</strong>
              </div>
              <div>
                <span className="block text-admin-ink-muted">Bukti Bayar</span>
                {paymentProofUrl ? (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setIsPaymentProofOpen((isOpen) => !isOpen)}
                      className="inline-flex items-center gap-1.5 text-admin-accent-strong font-semibold bg-transparent border-none p-0 cursor-pointer hover:underline"
                    >
                      {isPaymentProofOpen ? 'Sembunyikan bukti' : 'Tampilkan bukti'}
                      {isPaymentProofOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isPaymentProofOpen && (
                      <div className="mt-3 rounded-xl border border-admin-line-soft bg-white overflow-hidden">
                        <img
                          src={paymentProofUrl}
                          alt={`Bukti pembayaran ${order.orderNumber}`}
                          className="w-full max-h-80 object-contain"
                        />
                        <a
                          href={paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-admin-accent-strong no-underline hover:underline"
                        >
                          Buka di tab baru
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <strong className="text-admin-ink">Belum tersedia</strong>
                )}
              </div>
              <div>
                <span className="block text-admin-ink-muted">Deadline</span>
                <strong className="text-admin-ink">{formatDateTime(order.paymentDeadline)}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Pengiriman</h4>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-admin-ink-muted">Metode</span>
                <strong className="text-admin-ink">{order.shippingMethod || '-'}</strong>
              </div>
              <div>
                <span className="block text-admin-ink-muted">Service</span>
                <strong className="text-admin-ink">{order.shippingService || '-'}</strong>
              </div>
              <div>
                <span className="block text-admin-ink-muted">Toko Pemroses</span>
                <strong className="text-admin-ink">{order.store.name}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserRound className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Ringkasan</h4>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Total item</span>
                <strong className="text-admin-ink">{getOrderItemQuantity(order)} item</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Subtotal produk</span>
                <strong className="text-admin-ink">{formatCurrency(order.totalProductAmount)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Ongkir</span>
                <strong className="text-admin-ink">{formatCurrency(order.shippingCost)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Diskon</span>
                <strong className="text-admin-ink">{formatCurrency(order.discountAmount)}</strong>
              </div>
              <div className="flex justify-between gap-3 pt-3 border-t border-admin-line-soft">
                <span className="font-semibold text-admin-ink">Total bayar</span>
                <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <h4 className="text-base font-bold text-admin-ink m-0 mb-4">Aksi Admin</h4>
            {canShowActions ? (
              <div className="flex flex-col gap-2">
                {canReviewPayment && (
                  <button
                    type="button"
                    onClick={onReviewPayment}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               text-admin-accent-strong bg-admin-accent-soft border-none cursor-pointer
                               hover:bg-admin-accent/15 transition-all"
                  >
                    <ReceiptText className="w-4 h-4" />
                    Review Pembayaran
                  </button>
                )}
                {canManageFulfillment && (
                  <>
                    <button
                      type="button"
                      onClick={onManageFulfillment}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                 text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                 hover:bg-admin-blue/15 transition-all"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Cek Fulfillment
                    </button>
                    <button
                      type="button"
                      onClick={onShipOrder}
                      disabled={fulfillmentInProgress}
                      title={fulfillmentInProgress ? 'Selesaikan fulfillment aktif sebelum kirim pesanan' : undefined}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                 text-white bg-admin-green border-none cursor-pointer
                                 hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {fulfillmentInProgress ? <Loader2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      Kirim Produk
                    </button>
                  </>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={onCancelOrder}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               text-admin-red bg-admin-red-soft border-none cursor-pointer
                               hover:bg-admin-red/15 transition-all"
                  >
                    <Ban className="w-4 h-4" />
                    Batalkan Pesanan
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-admin-ink-muted m-0">Tidak ada aksi yang tersedia untuk status pesanan ini.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
