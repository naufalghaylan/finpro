import { Ban, Loader2, PackageCheck, ReceiptText, Send } from 'lucide-react'

type AdminOrderActionPanelProps = {
  canShowActions: boolean
  canReviewPayment: boolean
  canManageFulfillment: boolean
  canShipOrder: boolean
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
  canShipOrder,
  canCancel,
  fulfillmentInProgress,
  onReviewPayment,
  onCancelOrder,
  onManageFulfillment,
  onShipOrder,
}: AdminOrderActionPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="m-0 text-base font-bold text-admin-ink">Aksi Admin</h4>
        <p className="m-0 mt-1 text-xs leading-5 text-admin-ink-muted">
          Aksi yang tampil mengikuti status pesanan saat ini.
        </p>
      </div>

      {canShowActions ? (
        <div className="flex flex-col gap-2.5">
          {canReviewPayment && (
            <button
              type="button"
              onClick={onReviewPayment}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent-soft px-4 py-2.5 text-sm font-semibold text-admin-accent-strong transition-all hover:bg-admin-accent/15"
            >
              <ReceiptText className="h-4 w-4" />
              Tinjau Pembayaran
            </button>
          )}
          {canManageFulfillment && (
            <button
              type="button"
              onClick={onManageFulfillment}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-blue-soft px-4 py-2.5 text-sm font-semibold text-admin-blue transition-all hover:bg-admin-blue/15"
            >
              <PackageCheck className="h-4 w-4" />
              Kelola Mutasi Stok
            </button>
          )}
          {canShipOrder && (
            <>
              <button
                type="button"
                onClick={onShipOrder}
                disabled={fulfillmentInProgress}
                title={fulfillmentInProgress ? 'Selesaikan kebutuhan mutasi stok sebelum mengirim pesanan' : undefined}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-green px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {fulfillmentInProgress ? <Loader2 className="h-4 w-4 admin-spin" /> : <Send className="h-4 w-4" />}
                Kirim Pesanan
              </button>
              {fulfillmentInProgress && (
                <p className="m-0 rounded-xl bg-admin-amber-soft px-3 py-2 text-xs leading-5 text-admin-amber">
                  Selesaikan mutasi stok terlebih dahulu sebelum pesanan dikirim.
                </p>
              )}
            </>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={onCancelOrder}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-red-soft px-4 py-2.5 text-sm font-semibold text-admin-red transition-all hover:bg-admin-red/15"
            >
              <Ban className="h-4 w-4" />
              Batalkan Pesanan
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
          <p className="m-0 text-sm text-admin-ink-muted">Tidak ada aksi lanjutan untuk status pesanan ini.</p>
        </div>
      )}
    </section>
  )
}
