import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, X, XCircle } from 'lucide-react'
import { getUploadUrl } from '../../../components/orders/orderDisplay'
import type { AdminOrder } from '../../../types/order'
import { formatCurrency, formatDateTime } from '../../../utils/format'

type PaymentConfirmationAction = 'approve' | 'reject'

interface AdminPaymentReviewModalProps {
  order: AdminOrder
  pendingAction: PaymentConfirmationAction | null
  isConfirmingPayment: boolean
  onClose: () => void
  onSetPendingAction: (action: PaymentConfirmationAction | null) => void
  onConfirm: () => void
}

export function AdminPaymentReviewModal({
  order,
  pendingAction,
  isConfirmingPayment,
  onClose,
  onSetPendingAction,
  onConfirm,
}: AdminPaymentReviewModalProps) {
  const selectedPaymentProofUrl = getUploadUrl(order.paymentProof)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-admin-line-soft bg-admin-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-admin-line-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-admin-accent-strong m-0">
              Review Pembayaran Manual
            </p>
            <h3 className="text-lg font-bold text-admin-ink m-0 mt-1">{order.orderNumber}</h3>
            <p className="text-sm text-admin-ink-muted m-0 mt-1">
              Periksa bukti bayar sebelum menerima atau menolak pembayaran.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirmingPayment}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft
                       hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            aria-label="Tutup review pembayaran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-6">
          <div>
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 overflow-hidden">
              {selectedPaymentProofUrl ? (
                <img
                  src={selectedPaymentProofUrl}
                  alt={`Bukti pembayaran ${order.orderNumber}`}
                  className="w-full max-h-[520px] object-contain bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <AlertTriangle className="w-9 h-9 text-admin-amber" />
                  <p className="text-sm text-admin-ink-muted m-0">Bukti bayar tidak tersedia.</p>
                </div>
              )}
            </div>
            {selectedPaymentProofUrl && (
              <a
                href={selectedPaymentProofUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-admin-accent-strong no-underline hover:underline"
              >
                Buka gambar di tab baru
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-admin-ink-muted m-0 mb-3">Ringkasan</p>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="block text-admin-ink-muted">Customer</span>
                  <strong className="text-admin-ink">{order.user.name}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Toko</span>
                  <strong className="text-admin-ink">{order.store.name}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Total Bayar</span>
                  <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Tanggal Order</span>
                  <strong className="text-admin-ink">{formatDateTime(order.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onSetPendingAction('approve')}
                disabled={isConfirmingPayment || order.status !== 'WAITING_CONFIRMATION'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                           text-white bg-admin-green border-none cursor-pointer
                           hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terima Pembayaran
              </button>
              <button
                type="button"
                onClick={() => onSetPendingAction('reject')}
                disabled={isConfirmingPayment || order.status !== 'WAITING_CONFIRMATION'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                           text-admin-red bg-admin-red-soft border-none cursor-pointer
                           hover:bg-admin-red/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <XCircle className="w-4 h-4" />
                Tolak Bukti Bayar
              </button>
            </div>

            {pendingAction && (
              <div className="rounded-xl border border-admin-amber/30 bg-admin-amber-soft p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-admin-amber shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-admin-ink m-0">
                      {pendingAction === 'approve'
                        ? 'Terima pembayaran ini?'
                        : 'Tolak bukti bayar ini?'}
                    </h4>
                    <p className="text-xs text-admin-ink-soft leading-relaxed m-0 mt-1">
                      {pendingAction === 'approve'
                        ? 'Status pesanan akan berubah menjadi Diproses.'
                        : 'Status pesanan kembali ke Menunggu Pembayaran dan user bisa upload bukti baru.'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => onSetPendingAction(null)}
                    disabled={isConfirmingPayment}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-admin-ink-soft bg-admin-surface border border-admin-line-soft
                               cursor-pointer hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isConfirmingPayment}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white border-none
                                cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                ${pendingAction === 'approve' ? 'bg-admin-green' : 'bg-admin-red'}`}
                  >
                    {isConfirmingPayment && <Loader2 className="w-3.5 h-3.5 admin-spin" />}
                    {pendingAction === 'approve' ? 'Ya, Terima' : 'Ya, Tolak'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
