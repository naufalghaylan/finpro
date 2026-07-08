import { TicketPercent } from 'lucide-react'

export function CheckoutVoucherEmptyState() {
  return (
    <div className="checkout-voucher-empty">
      <TicketPercent aria-hidden="true" />
      <h3>Belum ada voucher</h3>
      <p>Voucher aktif dari akunmu akan tampil di sini.</p>
    </div>
  )
}
