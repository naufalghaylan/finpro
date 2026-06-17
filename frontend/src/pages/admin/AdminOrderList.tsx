import { Ban, ChevronLeft, ChevronRight, ClipboardList, Loader2, PackageCheck, Search, Send, Store as StoreIcon } from 'lucide-react'
import { formatCurrency, formatDateTime, getOrderItemQuantity, orderStatusDisplay } from '../../components/orders/orderDisplay'
import type { AdminOrder, OrderStatus } from '../../types/order'
import AdminOrderFulfillmentModal from './AdminOrderFulfillmentModal'
import { useAdminOrderList } from '../../hooks/admin/useAdminOrderList'
import { AdminPaymentReviewModal } from '../../components/admin/orders/AdminPaymentReviewModal'
import { AdminCancelOrderModal } from '../../components/admin/orders/AdminCancelOrderModal'
import { AdminShipOrderModal } from '../../components/admin/orders/AdminShipOrderModal'

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'WAITING_CONFIRMATION', label: 'Menunggu Konfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'CONFIRMED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-admin-amber-soft text-admin-amber',
  WAITING_CONFIRMATION: 'bg-admin-blue-soft text-admin-blue',
  PROCESSING: 'bg-admin-green-soft text-admin-green',
  SHIPPED: 'bg-admin-blue-soft text-admin-blue',
  CONFIRMED: 'bg-admin-green-soft text-admin-green',
  CANCELLED: 'bg-admin-red-soft text-admin-red',
}

const paymentMethodLabel: Record<AdminOrder['paymentMethod'], string> = {
  MANUAL_TRANSFER: 'Manual Transfer',
  PAYMENT_GATEWAY: 'Payment Gateway',
}

const canAdminCancelOrder = (order: AdminOrder) =>
  !['SHIPPED', 'CONFIRMED', 'CANCELLED'].includes(order.status)

const hasActiveFulfillment = (order: AdminOrder) =>
  order.stockMutations.some((mutation) => ['PENDING', 'IN_TRANSIT'].includes(mutation.status))

export default function AdminOrderList({ storeId }: { storeId?: number }) {
  const {
    orders,
    stores,
    loading,
    search,
    meta,
    statusFilter,
    selectedFilterStoreId,
    showStoreFilter,
    setSearch,
    setPage,
    setStatusFilter,
    setSelectedFilterStoreId,
    selectedOrder,
    pendingAction,
    isConfirmingPayment,
    setSelectedOrder,
    setPendingAction,
    handleConfirmManualPayment,
    closePaymentReview,
    cancelOrderTarget,
    cancelReason,
    isCancellingOrder,
    setCancelOrderTarget,
    setCancelReason,
    handleAdminCancelOrder,
    closeCancelDialog,
    fulfillmentOrder,
    setFulfillmentOrder,
    shipOrderTarget,
    isShippingOrder,
    setShipOrderTarget,
    handleShipOrder,
    closeShipDialog,
    fetchOrders,
  } = useAdminOrderList(storeId)

  return (
    <div className="font-admin">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">
            {storeId ? 'Daftar Pesanan Toko' : 'Daftar Pesanan Global'}
          </h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${meta.total} pesanan ditemukan`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {showStoreFilter && (
            <div className="relative">
              <StoreIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
              <select
                value={selectedFilterStoreId}
                onChange={(event) => {
                  setSelectedFilterStoreId(event.target.value === '' ? '' : Number(event.target.value))
                  setPage(1)
                }}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
              >
                <option value="">Semua Toko</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
            </div>
          )}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as OrderStatus | '')
                setPage(1)
              }}
              className="px-4 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nomor order..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         placeholder:text-admin-ink-muted
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-admin-line-soft rounded-2xl bg-admin-surface-2/30">
            <ClipboardList className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0">
              {storeId ? 'Belum ada pesanan di toko ini.' : 'Belum ada pesanan yang sesuai filter.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider rounded-tl-2xl">Order</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Customer</th>
                  {!storeId && (
                    <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Toko</th>
                  )}
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Pembayaran</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Item</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right rounded-tr-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusMeta = orderStatusDisplay[order.status]
                  const StatusIcon = statusMeta.Icon
                  const canReviewPayment =
                    order.paymentMethod === 'MANUAL_TRANSFER' &&
                    order.status === 'WAITING_CONFIRMATION' &&
                    Boolean(order.paymentProof)
                  const canCancel = canAdminCancelOrder(order)
                  const canManageFulfillment = order.status === 'PROCESSING'
                  const fulfillmentInProgress = hasActiveFulfillment(order)
                  const canShowActions = canReviewPayment || canManageFulfillment || canCancel

                  return (
                    <tr key={order.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-admin-ink">{order.orderNumber}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-admin-ink">{order.user.name}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">{order.user.email}</div>
                      </td>
                      {!storeId && (
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                            {order.store.name}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass[order.status]}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-admin-ink-soft">{paymentMethodLabel[order.paymentMethod]}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">
                          {order.shippingService || order.shippingMethod || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-admin-surface-2 text-admin-ink-soft">
                          {getOrderItemQuantity(order)} item
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-admin-ink">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canShowActions ? (
                          <div className="flex items-center justify-end gap-2">
                            {canReviewPayment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setPendingAction(null)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                           text-admin-accent-strong bg-admin-accent-soft border-none cursor-pointer
                                           hover:bg-admin-accent/15 transition-all duration-150"
                              >
                                Review
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManageFulfillment && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setFulfillmentOrder(order)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                             text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                             hover:bg-admin-blue/15 transition-all duration-150"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Fulfillment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShipOrderTarget(order)}
                                  disabled={fulfillmentInProgress}
                                  title={fulfillmentInProgress ? 'Selesaikan fulfillment aktif sebelum kirim pesanan' : undefined}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                             text-white bg-admin-green border-none cursor-pointer
                                             hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Kirim
                                </button>
                              </>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelOrderTarget(order)
                                  setCancelReason('')
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                           text-admin-red bg-admin-red-soft border-none cursor-pointer
                                           hover:bg-admin-red/15 transition-all duration-150"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Batalkan
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-admin-ink-muted">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-admin-line-soft/50 bg-admin-surface-2/20">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>
            <span className="text-xs font-semibold text-admin-ink-muted">
              Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
            </span>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <AdminPaymentReviewModal
          order={selectedOrder}
          pendingAction={pendingAction}
          isConfirmingPayment={isConfirmingPayment}
          onClose={closePaymentReview}
          onSetPendingAction={setPendingAction}
          onConfirm={handleConfirmManualPayment}
        />
      )}

      {cancelOrderTarget && (
        <AdminCancelOrderModal
          order={cancelOrderTarget}
          cancelReason={cancelReason}
          isCancellingOrder={isCancellingOrder}
          onClose={closeCancelDialog}
          onCancelReasonChange={setCancelReason}
          onConfirm={handleAdminCancelOrder}
        />
      )}

      {shipOrderTarget && (
        <AdminShipOrderModal
          order={shipOrderTarget}
          isShippingOrder={isShippingOrder}
          hasActiveFulfillment={hasActiveFulfillment(shipOrderTarget)}
          onClose={closeShipDialog}
          onConfirm={handleShipOrder}
        />
      )}

      {fulfillmentOrder && (
        <AdminOrderFulfillmentModal
          order={fulfillmentOrder}
          onClose={() => setFulfillmentOrder(null)}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  )
}
