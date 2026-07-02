import { Navigate, useParams } from 'react-router-dom'
import AdminOrderList from './AdminOrderList'

export default function AdminStoreOrdersPage() {
  const { id } = useParams()
  const storeId = Number(id)

  if (!id || Number.isNaN(storeId)) {
    return <Navigate to="/admin/stores" replace />
  }

  return (
    <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
      <AdminOrderList storeId={storeId} />
    </div>
  )
}