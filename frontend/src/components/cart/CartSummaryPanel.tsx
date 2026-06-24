import { ArrowRight, PackageCheck, TicketPercent, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'

interface CartSummaryPanelProps {
  totalQuantity: number
  subtotal: number
  fulfillmentBranch?: string
}

export function CartSummaryPanel({ totalQuantity, subtotal, fulfillmentBranch }: CartSummaryPanelProps) {
  const summaryRows = [
    { label: `Total harga (${totalQuantity} item)`, value: formatCurrency(subtotal) },
    { label: 'Ongkir', value: 'Pilih di checkout' },
  ]

  return (
    <aside className="cart-summary-panel" aria-label="Ringkasan keranjang">
      <div className="cart-summary-heading">
        <h3>Ringkasan Belanja</h3>
        <span>{totalQuantity} item</span>
      </div>

      <div className="cart-summary-store">
        <PackageCheck aria-hidden="true" />
        <div>
          <span>Pengiriman PanenMart</span>
          <strong>Dikirim dari {fulfillmentBranch ?? 'cabang terdekat'}</strong>
        </div>
      </div>

      <div className="cart-summary-benefits" aria-label="Info voucher dan pengiriman">
        <div>
          <TicketPercent aria-hidden="true" />
          <span>Voucher dipilih di checkout</span>
        </div>
        <div>
          <Truck aria-hidden="true" />
          <span>Ongkir dihitung setelah alamat dipilih</span>
        </div>
      </div>

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
      <p className="cart-summary-note">
        Total akhir akan diperbarui setelah voucher, ongkir, dan alamat pengiriman dipilih.
      </p>
      <Link to="/checkout" className="button primary cart-checkout-button">
        <span>Checkout ({totalQuantity})</span>
        <ArrowRight className="button-icon" aria-hidden="true" />
      </Link>
    </aside>
  )
}