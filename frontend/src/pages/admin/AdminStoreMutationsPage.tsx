import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AdminStoreFulfillmentPage from './AdminStoreFulfillmentPage'

export default function AdminStoreMutationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const storeId = Number(id)

  if (!id || Number.isNaN(storeId)) {
    return <Navigate to="/admin/stores" replace />
  }

  return (
    <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
      <AdminStoreFulfillmentPage
        storeId={storeId}
        onOpenOrders={() => navigate(`/admin/stores/${storeId}/orders`)}
      />
    </div>
  )
}