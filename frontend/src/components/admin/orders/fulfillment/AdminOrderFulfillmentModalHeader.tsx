import { X } from 'lucide-react'

type Props = {
  orderNumber: string
  requestCount: number
  onClose: () => void
  disabled: boolean
}

export function AdminOrderFulfillmentModalHeader({
  orderNumber,
  requestCount,
  onClose,
  disabled,
}: Props) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-admin-line-soft bg-admin-surface px-5 py-5 md:px-6">
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-admin-accent-strong">
            Mutasi Stok Pesanan
          </span>
          {requestCount > 0 && (
            <span className="rounded-full bg-admin-amber-soft px-2 py-0.5 text-[11px] font-bold text-admin-amber">
              {requestCount} produk perlu tindakan
            </span>
          )}
        </div>
        <h3 id="order-fulfillment-modal-title" className="m-0 truncate text-lg font-bold text-admin-ink sm:text-xl">{orderNumber}</h3>
        <p className="m-0 mt-1 text-sm text-admin-ink-muted">
          Tentukan toko sumber untuk setiap produk, lalu kirim semua permintaan sekaligus.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft transition-all hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Tutup mutasi stok pesanan"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  )
}
