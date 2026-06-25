import { AdminStoreFulfillmentActionModal } from '../../components/admin/orders/modals/AdminStoreFulfillmentActionModal'
import { AdminStoreFulfillmentDetailModal } from '../../components/admin/orders/modals/AdminStoreFulfillmentDetailModal'
import { AdminStoreFulfillmentIntro } from '../../components/admin/orders/fulfillment/AdminStoreFulfillmentIntro'
import { AdminStoreFulfillmentList } from '../../components/admin/orders/fulfillment/AdminStoreFulfillmentList'
import { AdminStoreFulfillmentPagination } from '../../components/admin/orders/fulfillment/AdminStoreFulfillmentPagination'
import { AdminStoreFulfillmentToolbar } from '../../components/admin/orders/fulfillment/AdminStoreFulfillmentToolbar'
import { useAdminStoreFulfillmentPage } from '../../hooks/admin/useAdminStoreFulfillmentPage'

type Props = {
  storeId: number
  onOpenOrders: () => void
}

export default function AdminStoreFulfillmentPage({ storeId, onOpenOrders }: Props) {
  const fulfillment = useAdminStoreFulfillmentPage({ storeId })

  return (
    <div className="font-admin">
      <AdminStoreFulfillmentIntro onOpenOrders={onOpenOrders} />
      <AdminStoreFulfillmentToolbar
        groupCount={fulfillment.groups.length}
        totalProducts={fulfillment.meta.total}
        direction={fulfillment.direction}
        status={fulfillment.status}
        search={fulfillment.search}
        onDirectionChange={fulfillment.handleDirectionChange}
        onStatusChange={fulfillment.handleStatusChange}
        onSearchChange={fulfillment.handleSearchChange}
      />
      <AdminStoreFulfillmentList
        loading={fulfillment.loading}
        groups={fulfillment.groups}
        storeId={storeId}
        onAction={fulfillment.openAction}
        onViewDetail={fulfillment.setDetailGroup}
      />
      <AdminStoreFulfillmentPagination
        loading={fulfillment.loading}
        meta={fulfillment.meta}
        onPrevious={fulfillment.goToPreviousPage}
        onNext={fulfillment.goToNextPage}
      />
      <AdminStoreFulfillmentDetailModal
        group={fulfillment.detailGroup}
        onClose={() => fulfillment.setDetailGroup(null)}
      />
      <AdminStoreFulfillmentActionModal
        actionTarget={fulfillment.actionTarget}
        actionNotes={fulfillment.actionNotes}
        confirmed={fulfillment.confirmed}
        approvedQuantity={fulfillment.approvedQuantity}
        submitting={fulfillment.submitting}
        actionShouldClose={fulfillment.actionShouldClose}
        onClose={fulfillment.closeAction}
        onSubmit={fulfillment.handleAction}
        onActionNotesChange={fulfillment.setActionNotes}
        onConfirmedChange={fulfillment.setConfirmed}
        onApprovedQuantityChange={fulfillment.setApprovedQuantity}
      />
    </div>
  )
}
