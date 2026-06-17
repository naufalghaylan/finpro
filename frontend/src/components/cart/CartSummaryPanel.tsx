import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'

interface CartSummaryPanelProps {
  totalQuantity: number
  subtotal: number
}

export function CartSummaryPanel({ totalQuantity, subtotal }: CartSummaryPanelProps) {
  const summaryRows = [
    { label: `Total harga (${totalQuantity} item)`, value: formatCurrency(subtotal) },
    { label: 'Ongkir', value: 'Pilih di checkout' },
  ]

  return (
    <aside className="cart-summary-panel" aria-label="Ringkasan keranjang">
      <h3>Rincian Belanja</h3>
      {summaryRows.map((row) => (
        <div className="cart-summary-row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className="cart-summary-row cart-summary-total">
        <span>Total sementara</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <Link to="/checkout" className="button primary cart-checkout-button">
        <span>Checkout ({totalQuantity})</span>
        <ArrowRight className="button-icon" aria-hidden="true" />
      </Link>
    </aside>
  )
}
