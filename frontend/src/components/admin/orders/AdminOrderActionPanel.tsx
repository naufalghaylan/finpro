import { Ban, Loader2, PackageCheck, ReceiptText, Send } from 'lucide-react'

type AdminOrderActionPanelProps = {
  canShowActions: boolean
  canReviewPayment: boolean
  canManageFulfillment: boolean
  canCancel: boolean
  fulfillmentInProgress: boolean
  onReviewPayment: () => void
  onCancelOrder: () => void
  onManageFulfillment: () => void
  onShipOrder: () => void
}

export function AdminOrderActionPanel({
  canShowActions,
  canReviewPayment,
  canManageFulfillment,
  canCancel,
  fulfillmentInProgress,
  onReviewPayment,
  onCancelOrder,
  onManageFulfillment,
  onShipOrder,
}: AdminOrderActionPanelProps) {
  return (
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
  )
}
