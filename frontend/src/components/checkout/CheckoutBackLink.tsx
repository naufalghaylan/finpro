import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CheckoutBackLink() {
  return (
    <Link to="/cart" className="button ghost checkout-back-link">
      <ArrowLeft className="button-icon" aria-hidden="true" />
      Kembali ke Keranjang
    </Link>
  )
}
