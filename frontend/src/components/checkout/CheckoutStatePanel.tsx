import { AlertCircle, Loader2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CheckoutLoadingState() {
  return (
    <div className="checkout-state-card">
      <Loader2 className="checkout-state-icon spin" aria-hidden="true" />
      <h2>Menyiapkan checkout...</h2>
      <p>Kami sedang mengambil keranjang, alamat, dan cabang PanenMart terdekat.</p>
    </div>
  )
}

export function CheckoutErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="checkout-state-card">
      <AlertCircle className="checkout-state-icon danger" aria-hidden="true" />
      <h2>Checkout belum bisa dibuka</h2>
      <p>{error}</p>
      <button type="button" className="button primary" onClick={onRetry}>
        Coba Lagi
      </button>
    </div>
  )
}

export function CheckoutEmptyState() {
  return (
    <div className="checkout-state-card">
      <ShoppingBag className="checkout-state-icon" aria-hidden="true" />
      <h2>Keranjang masih kosong</h2>
      <p>Tambahkan produk dulu sebelum membuat pesanan.</p>
      <Link to="/catalog" className="button primary">
        Mulai Belanja
      </Link>
    </div>
  )
}
