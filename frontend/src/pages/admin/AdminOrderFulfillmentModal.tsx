import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  PackagePlus,
  RefreshCw,
  Send,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
import {
  approveOrderFulfillment,
  receiveOrderFulfillment,
  rejectOrderFulfillment,
  requestOrderFulfillment,
} from '../../api/order.api'
import { getPublicStores } from '../../api/store'
import { useToast } from '../../components/common/Toast'
import { formatDateTime } from '../../components/orders/orderDisplay'
import { useAuthStore } from '../../store/authStore'
import type { AdminOrder, MutationStatus, OrderFulfillmentMutation } from '../../types/order'
import type { Store } from '../../types/store'
import { getApiErrorMessage } from '../../utils/apiError'

type AdminOrderFulfillmentModalProps = {
  order: AdminOrder
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

const mutationStatusLabel: Record<MutationStatus, string> = {
  PENDING: 'Menunggu Approval',
  APPROVED: 'Disetujui',
  IN_TRANSIT: 'Dalam Pengiriman',
  COMPLETED: 'Diterima',
  REJECTED: 'Ditolak',
}

const mutationStatusClass: Record<MutationStatus, string> = {
  PENDING: 'bg-admin-amber-soft text-admin-amber',
  APPROVED: 'bg-admin-blue-soft text-admin-blue',
  IN_TRANSIT: 'bg-admin-blue-soft text-admin-blue',
  COMPLETED: 'bg-admin-green-soft text-admin-green',
  REJECTED: 'bg-admin-red-soft text-admin-red',
}

const getErrorMessage = (error: unknown, fallback: string) => getApiErrorMessage(error, fallback)

export default function AdminOrderFulfillmentModal({
  order,
  onClose,
  onUpdated,
}: AdminOrderFulfillmentModalProps) {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const firstOrderItem = order.items[0]
  const [stores, setStores] = useState<Store[]>([])
  const [selectedProductId, setSelectedProductId] = useState(firstOrderItem?.product.id ?? 0)
  const selectedOrderItem = useMemo(
    () => order.items.find((item) => item.product.id === selectedProductId) ?? firstOrderItem,
    [firstOrderItem, order.items, selectedProductId],
  )
  const [sourceStoreId, setSourceStoreId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(selectedOrderItem?.quantity ?? 1)
  const [notes, setNotes] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [isLoadingStores, setIsLoadingStores] = useState(true)
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [isClosingDisabled, setIsClosingDisabled] = useState(false)

  const sourceStoreOptions = stores.filter((store) => store.id !== order.store.id)
  const canActForStore = (storeId: number) => user?.role === 'SUPER_ADMIN' || user?.storeId === storeId

  useEffect(() => {
    window.setTimeout(() => { setIsLoadingStores(true) }, 0)
    getPublicStores(1, 100)
      .then((response) => setStores(response.data))
      .catch(() => setStores([]))
      .finally(() => setIsLoadingStores(false))
  }, [])

  useEffect(() => {
    if (!selectedOrderItem) return
    window.setTimeout(() => { setQuantity(selectedOrderItem.quantity) }, 0)
  }, [selectedOrderItem])

  const runAction = async (
    actionKey: string,
    action: () => Promise<OrderFulfillmentMutation>,
    successMessage: string,
  ) => {
    try {
      setSubmittingKey(actionKey)
      setIsClosingDisabled(true)
      await action()
      showToast(successMessage, 'success')
      await onUpdated()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error, 'Gagal memproses fulfillment'), 'error')
    } finally {
      setSubmittingKey(null)
      setIsClosingDisabled(false)
    }
  }

  const handleRequestFulfillment = async () => {
    if (!selectedOrderItem || !sourceStoreId) {
      showToast('Pilih produk dan source store terlebih dahulu', 'error')
      return
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity))

    await runAction(
      'request',
      () => requestOrderFulfillment(order.id, {
        sourceStoreId: Number(sourceStoreId),
        productId: selectedOrderItem.product.id,
        quantity: normalizedQuantity,
        notes: notes.trim() || undefined,
      }),
      'Request fulfillment berhasil dibuat',
    )
  }

  const handleClose = () => {
    if (isClosingDisabled) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-bold text-admin-ink m-0">Riwayat Fulfillment</h4>
                <p className="text-sm text-admin-ink-muted m-0 mt-1">
                  Order bisa dikirim setelah request pending atau dalam pengiriman selesai.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Catatan Aksi
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
                placeholder="Opsional untuk approve, reject, atau receive"
                className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>

            {order.stockMutations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-admin-line-soft bg-admin-surface-2/30">
                <Truck className="w-10 h-10 text-admin-line" />
                <p className="text-sm text-admin-ink-muted m-0 mt-3">Belum ada request fulfillment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {order.stockMutations.map((mutation) => (
                  <div
                    key={mutation.id}
                    className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-bold text-admin-ink m-0">{mutation.product.name}</h5>
                        <p className="text-xs text-admin-ink-muted m-0 mt-1">
                          {mutation.sourceStore.name} ke {mutation.destinationStore.name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${mutationStatusClass[mutation.status]}`}>
                        {mutationStatusLabel[mutation.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 text-xs">
                      <div>
                        <span className="block text-admin-ink-muted">Quantity</span>
                        <strong className="text-admin-ink">{mutation.quantity}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Dibuat</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.createdAt)}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Dikirim</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.sentAt)}</strong>
                      </div>
                      <div>
                        <span className="block text-admin-ink-muted">Diterima</span>
                        <strong className="text-admin-ink">{formatDateTime(mutation.receivedAt)}</strong>
                      </div>
                    </div>

                    {mutation.notes && (
                      <p className="text-xs text-admin-ink-soft leading-relaxed rounded-xl bg-admin-surface-2/50 px-3 py-2 m-0 mb-3">
                        {mutation.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      {mutation.status === 'PENDING' && canActForStore(mutation.sourceStoreId) && (
                        <>
                          <button
                            type="button"
                            onClick={() => void runAction(
                              `approve-${mutation.id}`,
                              () => approveOrderFulfillment(mutation.id, actionNotes),
                              'Fulfillment disetujui dan stok dikirim',
                            )}
                            disabled={Boolean(submittingKey)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-admin-green
                                       border-none cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {submittingKey === `approve-${mutation.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 admin-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(
                              `reject-${mutation.id}`,
                              () => rejectOrderFulfillment(mutation.id, actionNotes),
                              'Fulfillment ditolak',
                            )}
                            disabled={Boolean(submittingKey)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-admin-red bg-admin-red-soft
                                       border-none cursor-pointer hover:bg-admin-red/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {submittingKey === `reject-${mutation.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 admin-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </button>
                        </>
                      )}

                      {mutation.status === 'IN_TRANSIT' && canActForStore(mutation.destinationStoreId) && (
                        <button
                          type="button"
                          onClick={() => void runAction(
                            `receive-${mutation.id}`,
                            () => receiveOrderFulfillment(mutation.id, actionNotes),
                            'Fulfillment diterima di toko tujuan',
                          )}
                          disabled={Boolean(submittingKey)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-admin-blue
                                     border-none cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {submittingKey === `receive-${mutation.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 admin-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
