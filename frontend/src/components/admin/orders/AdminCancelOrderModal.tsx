import { AlertTriangle, Loader2, X } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { formatCurrency } from '../../../utils/format'

interface AdminCancelOrderModalProps {
  order: AdminOrder
  cancelReason: string
  isCancellingOrder: boolean
  onClose: () => void
  onCancelReasonChange: (reason: string) => void
  onConfirm: () => void
}

export function AdminCancelOrderModal({
  order,
  cancelReason,
  isCancellingOrder,
  onClose,
  onCancelReasonChange,
  onConfirm,
}: AdminCancelOrderModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-admin-line-soft bg-admin-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-admin-line-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-admin-red m-0">
              Batalkan Pesanan
            </p>
            <h3 className="text-lg font-bold text-admin-ink m-0 mt-1">{order.orderNumber}</h3>
            <p className="text-sm text-admin-ink-muted m-0 mt-1">
              Pesanan dapat dibatalkan selama belum dikirim.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCancellingOrder}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft
                       hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            aria-label="Tutup konfirmasi pembatalan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-admin-red/20 bg-admin-red-soft p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-admin-red shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-admin-ink m-0">Yakin membatalkan pesanan ini?</h4>
                <p className="text-xs text-admin-ink-soft leading-relaxed m-0 mt-1">
                  Status pesanan akan menjadi Dibatalkan dan stok yang sudah di-reserve akan dikembalikan ke jurnal stok.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 my-5 text-sm">
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-3">
              <span className="block text-admin-ink-muted">Customer</span>
              <strong className="text-admin-ink">{order.user.name}</strong>
            </div>
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-3">
              <span className="block text-admin-ink-muted">Total</span>
              <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>

          <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
            Alasan Pembatalan
          </label>
          <textarea
            rows={4}
            value={cancelReason}
            onChange={(event) => onCancelReasonChange(event.target.value)}
            placeholder="Contoh: stok tidak siap, permintaan customer, atau alasan operasional lain"
            disabled={isCancellingOrder}
            className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink resize-y
                       placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent
                       disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          />

          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCancellingOrder}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-admin-ink-soft bg-admin-surface border border-admin-line-soft
                         cursor-pointer hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isCancellingOrder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-red border-none
                         cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isCancellingOrder && <Loader2 className="w-4 h-4 admin-spin" />}
              Ya, Batalkan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
