import { BadgePercent, CheckCircle2 } from 'lucide-react'
import type { CheckoutStoreDiscount } from '../../types/order'
import { formatCurrency, formatDateTime } from '../../utils/format'

type CheckoutDiscountPanelProps = {
  /** Diskon toko yang tersedia untuk pesanan ini (dihitung backend). */
  availableDiscountAmount?: number
  discounts?: CheckoutStoreDiscount[]
  /** Apakah user memilih memakai diskon. */
  isApplied?: boolean
  onToggleApply?: (apply: boolean) => void
}

export function CheckoutDiscountPanel({
  availableDiscountAmount = 0,
  discounts = [],
  isApplied = false,
  onToggleApply,
}: CheckoutDiscountPanelProps) {
  const hasDiscount = availableDiscountAmount > 0
  const displayedDiscounts = discounts.length > 0
    ? discounts
    : hasDiscount
      ? [{
        id: 0,
        name: 'Diskon Toko',
        productId: null,
        discountType: 'NOMINAL' as const,
        discountValue: availableDiscountAmount,
        minPurchase: 0,
        maxDiscount: null,
        startDate: '',
        endDate: null,
        amount: availableDiscountAmount,
      }]
      : []

  return (
    <section className='checkout-panel'>
      <div className='checkout-section-title'>
        <BadgePercent aria-hidden='true' />
        <div>
          <h2>Diskon</h2>
          <p>Pilih apakah ingin memakai diskon toko untuk pesanan ini.</p>
        </div>
      </div>

      {!hasDiscount ? (
        <div className='checkout-voucher-empty'>
          <BadgePercent aria-hidden='true' />
          <h3>Belum ada diskon</h3>
          <p>Tidak ada diskon toko yang berlaku untuk produk di keranjang ini.</p>
        </div>
      ) : (
        <div className='checkout-payment-grid'>
          {displayedDiscounts.map((discount) => (
            <button
              key={discount.id}
              type='button'
              className={`checkout-payment-card checkout-voucher-card${isApplied ? ' selected' : ''}`}
              onClick={() => onToggleApply?.(!isApplied)}
              aria-pressed={isApplied}
            >
              <div className='checkout-voucher-card-top'>
                <BadgePercent aria-hidden='true' />
                {isApplied && (
                  <span className='checkout-selection-badge'>
                    <CheckCircle2 aria-hidden='true' />
                    Terpasang
                  </span>
                )}
              </div>
              <strong className='checkout-voucher-name'>{discount.name}</strong>
              <span className='checkout-voucher-discount'>Hemat {formatCurrency(discount.amount)}</span>
              <span className='checkout-voucher-meta'>
                <strong>Berlaku untuk:</strong> {discount.productId ? 'Produk tertentu' : 'Semua produk'}
              </span>
              <span className='checkout-voucher-meta'>
                <strong>Min. Belanja:</strong> {formatCurrency(discount.minPurchase)}
              </span>
              <span className='checkout-voucher-expiry'>
                Berlaku s/d {formatDateTime(discount.endDate)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
