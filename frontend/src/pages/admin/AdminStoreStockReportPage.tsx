import { Navigate, useParams } from 'react-router-dom'
import AdminStockReport from './AdminStockReport'

export default function AdminStoreStockReportPage() {
  const { id } = useParams()
  const storeId = Number(id)

  if (!id || Number.isNaN(storeId)) {
    return <Navigate to="/admin/stores" replace />
  }

  return (
    <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
      <AdminStockReport storeId={storeId} />
    </div>
  )
}
