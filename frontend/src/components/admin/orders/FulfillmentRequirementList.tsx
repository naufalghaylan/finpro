import { Boxes, PackageCheck } from 'lucide-react'
import type { FulfillmentRequirement } from '../../../types/order'
import type { FulfillmentDraft } from '../../../hooks/admin/adminFulfillmentDraft'
import { FulfillmentRequirementCard } from './FulfillmentRequirementCard'

type Props = {
  requestRequirements: FulfillmentRequirement[]
  requestDrafts: Record<number, FulfillmentDraft>
  updateDraft: (productId: number, changes: Partial<FulfillmentDraft>) => void
  onSourceStoreChange: (requirement: FulfillmentRequirement, storeId: number | '') => void
}

export function FulfillmentRequirementList({
  requestRequirements,
  requestDrafts,
  updateDraft,
  onSourceStoreChange,
}: Props) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-admin-line-soft xl:border-b-0 xl:border-r xl:overflow-y-auto xl:overscroll-contain">
      <div className="flex items-start justify-between gap-4 px-5 py-5 md:px-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin-accent-soft text-admin-accent-strong">
            <Boxes className="h-5 w-5" />
          </span>
          <div>
            <h4 className="m-0 text-base font-bold text-admin-ink">Daftar Kebutuhan Stok</h4>
            <p className="m-0 mt-1 text-sm text-admin-ink-muted">
              Satu kartu mewakili satu produk yang kekurangan stok di toko tujuan.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5 md:px-6">
        {requestRequirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-admin-green/20 bg-admin-green-soft px-5 py-12 text-center">
            <PackageCheck className="h-10 w-10 text-admin-green" />
            <strong className="mt-3 text-sm text-admin-green">Seluruh kebutuhan mutasi sudah dibuat</strong>
            <span className="mt-1 text-xs text-admin-ink-muted">
              Pantau persetujuan dan penerimaan barang pada riwayat mutasi.
            </span>
          </div>
        ) : (
          requestRequirements.map((requirement, index) => (
            <FulfillmentRequirementCard
              key={requirement.productId}
              requirement={requirement}
              index={index}
              draft={requestDrafts[requirement.productId]}
              updateDraft={updateDraft}
              onSourceStoreChange={onSourceStoreChange}
            />
          ))
        )}
      </div>
    </section>
  )
}
