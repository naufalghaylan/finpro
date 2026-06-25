import { useState } from 'react'
import { ClipboardList, Loader2 } from 'lucide-react'
import type { AdminOrder, OrderStatus } from '../../types/order'
import AdminOrderFulfillmentModal from './AdminOrderFulfillmentModal'
import { useAdminOrderList } from '../../hooks/admin/useAdminOrderList'
import { AdminPaymentReviewModal } from '../../components/admin/orders/modals/AdminPaymentReviewModal'
import { AdminCancelOrderModal } from '../../components/admin/orders/modals/AdminCancelOrderModal'
import { AdminShipOrderModal } from '../../components/admin/orders/modals/AdminShipOrderModal'
import { AdminOrderDetailView } from '../../components/admin/orders/details/AdminOrderDetailView'
import { AdminOrderFilterBar } from '../../components/admin/orders/list/AdminOrderFilterBar'
import { AdminOrderPagination } from '../../components/admin/orders/list/AdminOrderPagination'
import { AdminOrderTable } from '../../components/admin/orders/list/AdminOrderTable'

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'WAITING_CONFIRMATION', label: 'Menunggu Konfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'CONFIRMED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const hasBlockingFulfillment = (order: AdminOrder) => !order.stockFulfillment.canShip

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
    paymentReviewShouldClose,
    setSelectedOrder,
    setPendingAction,
    handleConfirmManualPayment,
    closePaymentReview,
    cancelOrderTarget,
    cancelReason,
    isCancellingOrder,
    cancelDialogShouldClose,
    setCancelOrderTarget,
    setCancelReason,
    handleAdminCancelOrder,
    closeCancelDialog,
    fulfillmentOrder,
    setFulfillmentOrder,
    shipOrderTarget,
    isShippingOrder,
    shipDialogShouldClose,
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

          <div className="overflow-hidden rounded-3xl border border-admin-line-soft bg-admin-surface shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 bg-admin-surface-2/20 px-6 py-20 text-center">
                <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
                <p className="text-sm text-admin-ink-muted m-0">Memuat pesanan...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-admin-line bg-admin-surface-2/35 px-6 py-16 text-center">
                <ClipboardList className="w-10 h-10 text-admin-line" />
                <p className="text-sm text-admin-ink-muted m-0">
                  {storeId ? 'Belum ada pesanan di cabang ini.' : 'Tidak ada pesanan yang cocok dengan filter saat ini.'}
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
          requestClose={paymentReviewShouldClose}
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
          requestClose={cancelDialogShouldClose}
          onClose={closeCancelDialog}
          onCancelReasonChange={setCancelReason}
          onConfirm={handleAdminCancelOrder}
        />
      )}

      {shipOrderTarget && (
        <AdminShipOrderModal
          order={shipOrderTarget}
          isShippingOrder={isShippingOrder}
          requestClose={shipDialogShouldClose}
          hasActiveFulfillment={hasBlockingFulfillment(shipOrderTarget)}
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
