import { BadgePercent } from 'lucide-react'

export function CheckoutDiscountEmptyState() {
  return (
    <div className="checkout-voucher-empty">
      <BadgePercent aria-hidden="true" />
      <h3>Belum ada diskon</h3>
      <p>Tidak ada diskon toko yang berlaku untuk produk di keranjang ini.</p>
    </div>
  )
}
