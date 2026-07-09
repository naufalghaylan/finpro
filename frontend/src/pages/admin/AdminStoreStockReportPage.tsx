import { lazy, Suspense } from 'react'
import { Navigate, useParams } from 'react-router-dom'

const AdminStockReport = lazy(() => import('./AdminStockReport'))

export default function AdminStoreStockReportPage() {
  const { id } = useParams()
  const storeId = Number(id)

  if (!id || Number.isNaN(storeId)) {
    return <Navigate to="/admin/stores" replace />
  }

  return (
    <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading report...</div>}>
        <AdminStockReport storeId={storeId} />
      </Suspense>
    </div>
  )
}
