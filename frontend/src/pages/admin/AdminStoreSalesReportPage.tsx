import { lazy, Suspense } from 'react'
import { Navigate, useParams } from 'react-router-dom'

const AdminSalesReport = lazy(() => import('./AdminSalesReport'))

export default function AdminStoreSalesReportPage() {
  const { id } = useParams()
  const storeId = Number(id)

  if (!id || Number.isNaN(storeId)) {
    return <Navigate to="/admin/stores" replace />
  }

  return (
    <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading report...</div>}>
        <AdminSalesReport storeId={storeId} />
      </Suspense>
    </div>
  )
}
