import { AlertCircle, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OrdersLoadingState() {
  return (
    <div className="orders-list">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="order-card order-card--skeleton">
          <div className="order-skeleton-image" />
          <div className="order-skeleton-body">
            <span />
            <strong />
            <p />
          </div>
        </div>
      ))}
    </div>
  )
}

type OrdersErrorStateProps = {
  error: string
  onRetry: () => void
}

export function OrdersErrorState({ error, onRetry }: OrdersErrorStateProps) {
  return (
    <div className="orders-state-card">
      <AlertCircle className="orders-state-icon danger" aria-hidden="true" />
      <h2>Daftar pesanan belum bisa dimuat</h2>
      <p>{error}</p>
      <button type="button" className="button primary" onClick={onRetry}>
        Coba Lagi
      </button>
    </div>
  )
}

type OrdersEmptyStateProps = {
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function OrdersEmptyState({ hasActiveFilters, onClearFilters }: OrdersEmptyStateProps) {
  return (
    <div className="orders-state-card">
      <ClipboardList className="orders-state-icon" aria-hidden="true" />
      <h2>Belum ada pesanan ditemukan</h2>
      <p>
        {hasActiveFilters
          ? 'Coba ubah nomor order, nama produk, rentang tanggal, atau status pesanan.'
          : 'Setelah checkout berhasil, pesananmu akan tampil di sini.'}
      </p>
      {hasActiveFilters ? (
        <button type="button" className="button ghost" onClick={onClearFilters}>
          Reset Filter
        </button>
      ) : (
        <Link to="/catalog" className="button primary">
          Mulai Belanja
        </Link>
      )}
    </div>
  )
}
