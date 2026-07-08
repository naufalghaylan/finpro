import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  PackageCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'

type Props = {
  onOpenOrders: () => void
}

const steps: { label: string; detail: string; icon: LucideIcon }[] = [
  { label: 'Siapkan barang', detail: 'Toko sumber cek stok fisik', icon: ClipboardCheck },
  { label: 'Kirim antar toko', detail: 'Status dalam perjalanan', icon: Truck },
  { label: 'Terima dan periksa', detail: 'Pesanan siap dilanjutkan', icon: PackageCheck },
]

export function AdminStoreFulfillmentIntro({ onOpenOrders }: Props) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm">
      <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-admin-amber" />
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-admin-amber">Catatan operasional</p>
          </div>
          <h3 className="m-0 text-lg font-bold text-admin-ink">Prosedur Mutasi Stok Antar Toko</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-admin-ink-soft">
            Admin wajib memastikan barang siap. Walaupun stok sudah tercatat berpindah di aplikasi,
            tunggu sampai barang benar-benar tiba dan diperiksa sebelum mengirim pesanan pelanggan.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenOrders}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-accent-strong"
        >
          Buat dari pesanan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 border-t border-admin-line-soft bg-admin-surface-2/20 sm:grid-cols-3">
        {steps.map(({ label, detail, icon: StepIcon }, index) => (
          <div key={label} className="flex items-center gap-3 border-b border-admin-line-soft p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-accent-soft text-admin-accent-strong">
              <StepIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="m-0 text-xs font-semibold text-admin-accent-strong">Tahap {index + 1}</p>
              <p className="m-0 text-sm font-bold text-admin-ink">{label}</p>
              <p className="m-0 mt-0.5 text-xs text-admin-ink-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
