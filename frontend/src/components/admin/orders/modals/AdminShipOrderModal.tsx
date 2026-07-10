import { AlertTriangle, Loader2, Send, X } from 'lucide-react'
import { AdminModal } from '../../AdminModal'
import type { AdminOrder } from '../../../../types/order'
import { formatCurrency } from '../../../../utils/format'

interface AdminShipOrderModalProps {
  order: AdminOrder
  isShippingOrder: boolean
  onClose: () => void
  onConfirm: () => void
  hasActiveFulfillment: boolean
  requestClose?: boolean
}

export function AdminShipOrderModal({
  order,
  isShippingOrder,
  onClose,
  onConfirm,
  hasActiveFulfillment,
  requestClose = false,
}: AdminShipOrderModalProps) {
  return (
    <AdminModal
      onClose={onClose}
      busy={isShippingOrder}
      requestClose={requestClose}
      labelledBy="admin-ship-order-title"
    >
      {(closeModal) => (
        <>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-admin-line-soft sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-admin-green m-0">
              Kirim Pesanan
            </p>
            <h3 id="admin-ship-order-title" className="text-lg font-bold text-admin-ink m-0 mt-1 wrap-break-word">{order.orderNumber}</h3>
            <p className="text-sm text-admin-ink-muted m-0 mt-1">
              Pastikan semua barang siap sebelum status diubah menjadi Dikirim.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isShippingOrder}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft
                       hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            aria-label="Tutup konfirmasi pengiriman"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="rounded-xl border border-admin-amber/30 bg-admin-amber-soft p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-admin-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-admin-ink m-0">Barang sudah siap dikirim?</h4>
                <p className="text-xs text-admin-ink-soft leading-relaxed m-0 mt-1">
                  Status pesanan akan menjadi Dikirim dan customer bisa mengonfirmasi pesanan diterima.
                  Sistem juga akan otomatis menyelesaikan pesanan setelah 2 x 24 jam.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 my-5 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-3">
              <span className="block text-admin-ink-muted">Pelanggan</span>
              <strong className="text-admin-ink">{order.user.name}</strong>
            </div>
            <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-3">
              <span className="block text-admin-ink-muted">Total</span>
              <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>

          {hasActiveFulfillment && (
            <div className="rounded-xl border border-admin-red/20 bg-admin-red-soft p-4 mb-5">
              <p className="text-xs text-admin-red leading-relaxed m-0">
                Masih ada mutasi stok yang menunggu atau dalam perjalanan. Pastikan barang diterima sebelum pesanan dikirim.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={isShippingOrder}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-admin-ink-soft bg-admin-surface border border-admin-line-soft
                         sm:w-auto
                         cursor-pointer hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isShippingOrder || hasActiveFulfillment}
              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-green border-none
                         sm:w-auto
                         cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isShippingOrder ? <Loader2 className="w-4 h-4 admin-spin" /> : <Send className="w-4 h-4" />}
              Ya, Kirim
            </button>
          </div>
        </div>
        </>
      )}
    </AdminModal>
  )
}
