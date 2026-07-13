import { AlertTriangle, MapPin } from 'lucide-react'
import type { FulfillmentRequirement } from '../../../../types/order'
import {
  getFulfillmentRequestQuantityLimit,
  type FulfillmentDraft,
} from '../../../../hooks/admin/adminFulfillmentDraft'

type Props = {
  requirement: FulfillmentRequirement
  index: number
  draft?: FulfillmentDraft
  updateDraft: (productId: number, changes: Partial<FulfillmentDraft>) => void
  onSourceStoreChange: (requirement: FulfillmentRequirement, storeId: number | '') => void
}

const fieldLabelClassName = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft'
const fieldControlClassName = 'h-12 w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/20'

export function FulfillmentRequirementCard({
  requirement,
  index,
  draft,
  updateDraft,
  onSourceStoreChange,
}: Props) {
  const selectedSource = requirement.sources.find(
    (source) => source.storeId === draft?.sourceStoreId,
  )
  const maxQuantity = getFulfillmentRequestQuantityLimit(requirement, draft)
  const getSourceOptionLabel = (source: FulfillmentRequirement['sources'][number]) => (
    `${source.storeName} - ${source.distanceKm} km - tersedia ${source.availableQuantity} item`
  )

  return (
    <article className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4 transition-colors focus-within:border-admin-accent/40 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-surface text-xs font-bold text-admin-accent-strong shadow-sm ring-1 ring-admin-line-soft">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h5 className="m-0 truncate text-sm font-bold text-admin-ink">
              {requirement.productName}
            </h5>
            <p className="m-0 mt-1 text-xs text-admin-ink-muted">
              Total kebutuhan dari toko lain: {requirement.requiredQuantity} item
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-admin-amber-soft px-2.5 py-1 text-xs font-bold text-admin-amber">
          Kurang {requirement.remainingQuantity}
        </span>
      </div>

      {requirement.sources.length === 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-admin-red/20 bg-admin-red-soft p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-admin-red" />
          <p className="m-0 text-xs leading-5 text-admin-red">
            Belum ada toko sumber dengan stok tersedia. Tambahkan stok atau pilih sumber lain setelah stok tersedia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
          <div>
            <label
              htmlFor={`source-${requirement.productId}`}
              className={fieldLabelClassName}
            >
              Toko Sumber
            </label>
            <select
              id={`source-${requirement.productId}`}
              value={draft?.sourceStoreId ?? ''}
              onChange={(event) => onSourceStoreChange(
                requirement,
                event.target.value === '' ? '' : Number(event.target.value),
              )}
              className={fieldControlClassName}
            >
              <option value="">Pilih toko sumber</option>
              {requirement.sources.map((source) => (
                <option key={source.storeId} value={source.storeId}>
                  {getSourceOptionLabel(source)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`quantity-${requirement.productId}`}
              className={fieldLabelClassName}
            >
              Jumlah
            </label>
            <input
              id={`quantity-${requirement.productId}`}
              type="number"
              min={1}
              max={maxQuantity}
              value={draft?.quantity ?? requirement.remainingQuantity}
              onChange={(event) => updateDraft(requirement.productId, {
                quantity: Number(event.target.value),
              })}
              className={fieldControlClassName}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor={`notes-${requirement.productId}`}
              className={fieldLabelClassName}
            >
              Catatan <span className="font-normal normal-case text-admin-ink-muted">(opsional)</span>
            </label>
            <input
              id={`notes-${requirement.productId}`}
              type="text"
              maxLength={500}
              value={draft?.notes ?? ''}
              onChange={(event) => updateDraft(requirement.productId, {
                notes: event.target.value,
              })}
              placeholder="Contoh: mohon periksa tanggal kedaluwarsa"
              className={`${fieldControlClassName} placeholder:text-admin-ink-muted`}
            />
          </div>

          {selectedSource && (
            <div className="flex items-center gap-2 text-xs text-admin-ink-muted md:col-span-2">
              <MapPin className="h-3.5 w-3.5 text-admin-accent-strong" />
              <span>
                {selectedSource.storeName}, {selectedSource.city} - {selectedSource.distanceKm} km - tersedia {selectedSource.availableQuantity} item
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
