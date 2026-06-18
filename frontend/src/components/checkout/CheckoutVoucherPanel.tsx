import { TicketPercent, CheckCircle2 } from 'lucide-react'
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
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-soft)' }}>
          <TicketPercent size={48} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--ink)', fontSize: '1.1rem' }}>Tidak ada Voucher</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Saat ini belum ada voucher aktif yang tersedia untuk Anda.</p>
        </div>
      ) : (
        <div className="checkout-payment-grid">
          {vouchers.map((voucher) => {
          const discountPreview = getVoucherDiscountPreview(voucher, items, subtotal, shippingCost)
          const isSelected = selectedVoucherId === voucher.id
          const isDisabled = discountPreview <= 0

          return (
            <div
              key={voucher.id}
              className={`checkout-payment-card ${isSelected ? 'selected' : ''}`}
              style={{
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => {
                if (isDisabled) return;
                onVoucherChange(isSelected ? null : voucher.id);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <TicketPercent aria-hidden="true" />
                {isSelected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-strong)', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(232, 107, 79, 0.1)', padding: '4px 8px', borderRadius: '99px' }}>
                    <CheckCircle2 size={14} /> Terpasang
                  </div>
                )}
              </div>
              <strong style={{ fontSize: '1.05rem', color: isSelected ? 'var(--accent-strong)' : 'var(--ink)', marginTop: '4px' }}>{voucher.name}</strong>
              <span style={{ color: 'var(--accent-strong)', fontWeight: 'bold', fontSize: '1.05rem', margin: '4px 0' }}>
                {discountPreview > 0 ? `-${formatCurrency(discountPreview)}` : 'Tidak memenuhi'}
              </span>
              <span style={{ fontSize: '0.85rem' }}>
                <strong>Kode:</strong> {voucher.code}
              </span>
              <span style={{ fontSize: '0.85rem' }}>
                <strong>Min. Belanja:</strong> {formatCurrency(voucher.minPurchase)}
              </span>
              <span style={{ fontSize: '0.8rem', marginTop: 'auto', paddingTop: '8px' }}>
                Berlaku s/d {formatDateTime(voucher.expiredAt)}
              </span>
            </div>
          )
        })}
        </div>
      )}
    </section>
  )
}
