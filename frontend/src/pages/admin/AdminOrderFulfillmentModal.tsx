import {
  Loader2,
  PackagePlus,
  RefreshCw,
  X,
} from 'lucide-react'
import type { AdminOrder } from '../../types/order'
import { useAdminOrderFulfillment } from '../../hooks/admin/useAdminOrderFulfillment'
import { AdminOrderFulfillmentHistory } from '../../components/admin/orders/AdminOrderFulfillmentHistory'

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
  const {
    selectedProductId,
    setSelectedProductId,
    selectedOrderItem,
    sourceStoreId,
    setSourceStoreId,
    quantity,
    setQuantity,
    notes,
    setNotes,
    actionNotes,
    setActionNotes,
    isLoadingStores,
    submittingKey,
    isClosingDisabled,
    sourceStoreOptions,
    canActForStore,
    handleRequestFulfillment,
    handleApproveFulfillment,
    handleRejectFulfillment,
    handleReceiveFulfillment,
    handleClose,
  } = useAdminOrderFulfillment({ order, onClose, onUpdated })

  return (
    <div className="fixed left-0 right-0 bottom-0 top-[72px] z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-admin-line-soft bg-admin-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-admin-line-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-admin-accent-strong m-0">
              Fulfillment Order
            </p>
            <h3 className="text-lg font-bold text-admin-ink m-0 mt-1">{order.orderNumber}</h3>
            <p className="text-sm text-admin-ink-muted m-0 mt-1">
              Request stok antar toko dan selesaikan mutasi sebelum pesanan dikirim.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosingDisabled}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft
                       hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            aria-label="Tutup fulfillment order"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 p-6">
          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PackagePlus className="w-5 h-5 text-admin-accent-strong" />
              <h4 className="text-base font-bold text-admin-ink m-0">Request Transfer Stok</h4>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                  Produk Order
                </label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(Number(event.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                >
                  {order.items.map((item) => (
                    <option key={item.id} value={item.product.id}>
                      {item.product.name} ({item.quantity} item)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                  Source Store
                </label>
                <select
                  value={sourceStoreId}
                  onChange={(event) => setSourceStoreId(event.target.value === '' ? '' : Number(event.target.value))}
                  disabled={isLoadingStores}
                  className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">{isLoadingStores ? 'Memuat toko...' : 'Pilih source store'}</option>
                  {sourceStoreOptions.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedOrderItem?.quantity}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                  Catatan
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Catatan request fulfillment"
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink resize-y
                             placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleRequestFulfillment()}
                disabled={Boolean(submittingKey) || !selectedOrderItem || !sourceStoreId}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent
                           border-none cursor-pointer hover:bg-admin-accent-strong disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submittingKey === 'request' ? (
                  <Loader2 className="w-4 h-4 admin-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Buat Request
              </button>
            </div>
          </section>

          <AdminOrderFulfillmentHistory
            order={order}
            actionNotes={actionNotes}
            setActionNotes={setActionNotes}
            submittingKey={submittingKey}
            canActForStore={canActForStore}
            onApprove={handleApproveFulfillment}
            onReject={handleRejectFulfillment}
            onReceive={handleReceiveFulfillment}
          />
        </div>
      </div>
    </div>
  )
}
