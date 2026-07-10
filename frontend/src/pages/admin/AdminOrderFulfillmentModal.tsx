import { AdminModal } from '../../components/admin/AdminModal'
import { AdminOrderFulfillmentModalHeader } from '../../components/admin/orders/fulfillment/AdminOrderFulfillmentModalHeader'
import { FulfillmentHistoryColumn } from '../../components/admin/orders/fulfillment/FulfillmentHistoryColumn'
import { FulfillmentRequestFooter } from '../../components/admin/orders/fulfillment/FulfillmentRequestFooter'
import { FulfillmentRequirementList } from '../../components/admin/orders/fulfillment/FulfillmentRequirementList'
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
      cardClassName="admin-modal-card-large"
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
  const fulfillment = useAdminOrderFulfillment({ order, onClose, onUpdated })

  return (
    <>
      <AdminOrderFulfillmentModalHeader
        orderNumber={order.orderNumber}
        requestCount={fulfillment.requestRequirements.length}
        onClose={fulfillment.handleClose}
        disabled={fulfillment.isClosingDisabled}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain xl:overflow-hidden">
        <div className="grid min-h-0 grid-cols-1 xl:h-full xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="flex min-h-0 min-w-0 flex-col xl:h-full xl:overflow-hidden">
            <FulfillmentRequirementList
              requestRequirements={fulfillment.requestRequirements}
              requestDrafts={fulfillment.requestDrafts}
              updateDraft={fulfillment.updateDraft}
              onSourceStoreChange={fulfillment.handleSourceStoreChange}
            />
            <FulfillmentRequestFooter
              requestCount={fulfillment.requestRequirements.length}
              totalRequestQuantity={fulfillment.totalRequestQuantity}
              submittingKey={fulfillment.submittingKey}
              canSubmitRequests={fulfillment.canSubmitRequests}
              onSubmit={fulfillment.handleRequestFulfillments}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col border-t border-admin-line-soft xl:h-full xl:overflow-hidden xl:border-t-0">
            <FulfillmentHistoryColumn
              order={order}
              actionNotes={fulfillment.actionNotes}
              setActionNotes={fulfillment.setActionNotes}
              submittingKey={fulfillment.submittingKey}
              pendingConfirmation={fulfillment.pendingConfirmation}
              canActForStore={fulfillment.canActForStore}
              onApprove={fulfillment.handleApproveFulfillment}
              onReject={fulfillment.handleRejectFulfillment}
              onReceive={fulfillment.handleReceiveFulfillment}
              onCancelConfirmation={fulfillment.clearPendingConfirmation}
              onConfirmConfirmation={fulfillment.handleConfirmFulfillmentAction}
            />
          </div>
        </div>
      </div>
    </>
  )
}
