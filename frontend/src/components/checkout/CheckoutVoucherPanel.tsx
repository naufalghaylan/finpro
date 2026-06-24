import { CheckCircle2, TicketPercent } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import type { CheckoutVoucher } from '../../types/order'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { getVoucherDiscountPreview } from './checkoutVoucher'

type CheckoutVoucherPanelProps = {
  vouchers: CheckoutVoucher[]
  items: CartItem[]
  subtotal: number
  shippingCost: number
  selectedVoucherId: number | null
  onVoucherChange: (voucherId: number | null) => void
}

export function CheckoutVoucherPanel({
  vouchers,
  items,
  subtotal,
  shippingCost,
  selectedVoucherId,
  onVoucherChange,
}: CheckoutVoucherPanelProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <TicketPercent aria-hidden="true" />
        <div>
          <h2>Voucher</h2>
          <p>Pakai voucher aktif dari akunmu untuk pesanan ini.</p>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="checkout-voucher-empty">
          <TicketPercent aria-hidden="true" />
          <h3>Belum ada voucher</h3>
          <p>Voucher aktif dari akunmu akan tampil di sini.</p>
        </div>
      ) : (
        <div className="checkout-payment-grid">
          {vouchers.map((voucher) => {
            const discountPreview = getVoucherDiscountPreview(voucher, items, subtotal, shippingCost)
            const isSelected = selectedVoucherId === voucher.id
            const isDisabled = discountPreview <= 0

            return (
              <button
                key={voucher.id}
                type="button"
                className={`checkout-payment-card checkout-voucher-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                disabled={isDisabled}
                onClick={() => onVoucherChange(isSelected ? null : voucher.id)}
              >
                <div className="checkout-voucher-card-top">
                  <TicketPercent aria-hidden="true" />
                  {isSelected && (
                    <span className="checkout-selection-badge">
                      <CheckCircle2 aria-hidden="true" />
                      Terpasang
                    </span>
                  )}
                </div>
                <strong className="checkout-voucher-name">{voucher.name}</strong>
                <span className="checkout-voucher-discount">
                  {discountPreview > 0 ? `-${formatCurrency(discountPreview)}` : 'Tidak memenuhi'}
                </span>
                <span className="checkout-voucher-meta">
                  <strong>Kode:</strong> {voucher.code}
                </span>
                <span className="checkout-voucher-meta">
                  <strong>Min. Belanja:</strong> {formatCurrency(voucher.minPurchase)}
                </span>
                <span className="checkout-voucher-expiry">
                  Berlaku s/d {formatDateTime(voucher.expiredAt)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
