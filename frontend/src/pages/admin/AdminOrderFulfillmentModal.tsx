import {
  AlertTriangle,
  Boxes,
  Loader2,
  MapPin,
  PackageCheck,
  Send,
  X,
} from 'lucide-react'
import { AdminModal } from '../../components/admin/AdminModal'
import { AdminOrderFulfillmentHistory } from '../../components/admin/orders/AdminOrderFulfillmentHistory'
import { useAdminOrderFulfillment } from '../../hooks/admin/useAdminOrderFulfillment'
import type { AdminOrder } from '../../types/order'

type AdminOrderFulfillmentModalProps = {
  order: AdminOrder
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

export default function AdminOrderFulfillmentModal({
  order,
  onClose,
  onUpdated,
}: AdminOrderFulfillmentModalProps) {
  return (
    <AdminModal
      onClose={onClose}
      closeOnBackdrop={false}
      labelledBy="order-fulfillment-modal-title"
      maxWidthClassName="max-w-6xl"
    >
      {(closeModal) => (
        <AdminOrderFulfillmentModalContent
          order={order}
          onClose={closeModal}
          onUpdated={onUpdated}
        />
      )}
    </AdminModal>
  )
}

function AdminOrderFulfillmentModalContent({
  order,
  onClose,
  onUpdated,
}: AdminOrderFulfillmentModalProps) {
  const {
    requestRequirements,
    requestDrafts,
    updateDraft,
    handleSourceStoreChange,
    canSubmitRequests,
    totalRequestQuantity,
    actionNotes,
    setActionNotes,
    submittingKey,
    isClosingDisabled,
    pendingConfirmation,
    clearPendingConfirmation,
    handleConfirmFulfillmentAction,
    canActForStore,
    handleRequestFulfillments,
    handleApproveFulfillment,
    handleRejectFulfillment,
    handleReceiveFulfillment,
    handleClose,
  } = useAdminOrderFulfillment({ order, onClose, onUpdated })

  return (
    <>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-admin-line-soft bg-admin-surface px-5 py-5 md:px-6">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-admin-accent-strong">
                Mutasi Stok Pesanan
              </span>
              {requestRequirements.length > 0 && (
                <span className="rounded-full bg-admin-amber-soft px-2 py-0.5 text-[11px] font-bold text-admin-amber">
                  {requestRequirements.length} produk perlu tindakan
                </span>
              )}
            </div>
            <h3 id="order-fulfillment-modal-title" className="m-0 truncate text-xl font-bold text-admin-ink">{order.orderNumber}</h3>
            <p className="m-0 mt-1 text-sm text-admin-ink-muted">
              Tentukan toko sumber untuk setiap produk, lalu kirim semua permintaan sekaligus.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosingDisabled}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft transition-all hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Tutup mutasi stok pesanan"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto xl:overflow-hidden overscroll-contain">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] min-h-full xl:h-full">
          <section className="flex flex-col min-h-0 min-w-0 border-b border-admin-line-soft xl:border-b-0 xl:border-r xl:overflow-y-auto xl:overscroll-contain">
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
                requestRequirements.map((requirement, index) => {
                  const draft = requestDrafts[requirement.productId]
                  const selectedSource = requirement.sources.find(
                    (source) => source.storeId === draft?.sourceStoreId,
                  )
                  const maxQuantity = Math.min(
                    requirement.remainingQuantity,
                    selectedSource?.availableQuantity ?? requirement.remainingQuantity,
                  )

                  return (
                    <article
                      key={requirement.productId}
                      className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4 transition-colors focus-within:border-admin-accent/40 md:p-5"
                    >
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
                              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft"
                            >
                              Toko Sumber
                            </label>
                            <select
                              id={`source-${requirement.productId}`}
                              value={draft?.sourceStoreId ?? ''}
                              onChange={(event) => handleSourceStoreChange(
                                requirement,
                                event.target.value === '' ? '' : Number(event.target.value),
                              )}
                              className="w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/20"
                            >
                              <option value="">Pilih toko sumber terdekat</option>
                              {requirement.sources.map((source) => (
                                <option key={source.storeId} value={source.storeId}>
                                  {source.storeName} - {source.distanceKm} km - {source.availableQuantity} item
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`quantity-${requirement.productId}`}
                              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft"
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
                              className="w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/20"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label
                              htmlFor={`notes-${requirement.productId}`}
                              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft"
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
                              className="w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm text-admin-ink transition-all placeholder:text-admin-ink-muted focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/20"
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
                })
              )}
            </div>

            {requestRequirements.length > 0 && (
              <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-admin-line-soft bg-admin-surface/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
                <div>
                  <strong className="block text-sm text-admin-ink">
                    {requestRequirements.length} produk - {totalRequestQuantity} item
                  </strong>
                  <span className="text-xs text-admin-ink-muted">
                    Semua permintaan dibuat bersama dalam satu proses.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRequestFulfillments()}
                  disabled={Boolean(submittingKey) || !canSubmitRequests}
                  className="inline-flex min-w-[220px] cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-admin-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submittingKey === 'request-batch' ? (
                    <Loader2 className="h-4 w-4 admin-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Buat Semua Permintaan
                </button>
              </footer>
            )}
          </section>

          <div className="min-h-0 min-w-0 bg-admin-surface px-5 py-5 md:px-6 xl:overflow-y-auto xl:overscroll-contain">
            <AdminOrderFulfillmentHistory
              order={order}
              actionNotes={actionNotes}
              setActionNotes={setActionNotes}
              submittingKey={submittingKey}
              pendingConfirmation={pendingConfirmation}
              canActForStore={canActForStore}
              onApprove={handleApproveFulfillment}
              onReject={handleRejectFulfillment}
              onReceive={handleReceiveFulfillment}
              onCancelConfirmation={clearPendingConfirmation}
              onConfirmConfirmation={handleConfirmFulfillmentAction}
            />
          </div>
        </div>
        </div>
    </>
  )
}
