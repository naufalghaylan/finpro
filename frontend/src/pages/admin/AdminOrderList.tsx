import { useState } from 'react'
import { ClipboardList, Loader2 } from 'lucide-react'
import type { AdminOrder, OrderStatus } from '../../types/order'
import AdminOrderFulfillmentModal from './AdminOrderFulfillmentModal'
import { useAdminOrderList } from '../../hooks/admin/useAdminOrderList'
import { AdminPaymentReviewModal } from '../../components/admin/orders/AdminPaymentReviewModal'
import { AdminCancelOrderModal } from '../../components/admin/orders/AdminCancelOrderModal'
import { AdminShipOrderModal } from '../../components/admin/orders/AdminShipOrderModal'
import { AdminOrderDetailView } from '../../components/admin/orders/AdminOrderDetailView'
import { AdminOrderFilterBar } from '../../components/admin/orders/AdminOrderFilterBar'
import { AdminOrderPagination } from '../../components/admin/orders/AdminOrderPagination'
import { AdminOrderTable } from '../../components/admin/orders/AdminOrderTable'

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'WAITING_CONFIRMATION', label: 'Menunggu Konfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'CONFIRMED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const hasActiveFulfillment = (order: AdminOrder) =>
  order.stockMutations.some((mutation) => ['PENDING', 'IN_TRANSIT'].includes(mutation.status))

export default function AdminOrderList({ storeId }: { storeId?: number }) {
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null)
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
  const activeDetailOrder = detailOrder
    ? orders.find((order) => order.id === detailOrder.id) ?? detailOrder
    : null

  return (
    <div className="font-admin">
      {activeDetailOrder ? (
        <AdminOrderDetailView
          order={activeDetailOrder}
          onBack={() => setDetailOrder(null)}
          onReviewPayment={() => {
            setSelectedOrder(activeDetailOrder)
            setPendingAction(null)
          }}
          onCancelOrder={() => {
            setCancelOrderTarget(activeDetailOrder)
            setCancelReason('')
          }}
          onManageFulfillment={() => {
            setFulfillmentOrder(activeDetailOrder)
          }}
          onShipOrder={() => {
            setShipOrderTarget(activeDetailOrder)
          }}
        />
      ) : (
        <>
          <AdminOrderFilterBar
            storeId={storeId}
            loading={loading}
            totalOrders={meta.total}
            showStoreFilter={showStoreFilter}
            stores={stores}
            selectedFilterStoreId={selectedFilterStoreId}
            statusFilter={statusFilter}
            search={search}
            statusOptions={statusOptions}
            onStoreChange={(id) => {
              setSelectedFilterStoreId(id)
              setPage(1)
            }}
            onStatusChange={(status) => {
              setStatusFilter(status)
              setPage(1)
            }}
            onSearchChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
          />

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
              <AdminOrderTable orders={orders} storeId={storeId} onViewDetail={setDetailOrder} />
            )}

            {!loading && (
              <AdminOrderPagination meta={meta} onPageChange={setPage} />
            )}
          </div>
        </>
      )}

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
