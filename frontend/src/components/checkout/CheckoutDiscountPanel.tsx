import { BadgePercent, CheckCircle2 } from 'lucide-react'

export type CheckoutDiscountOption = {
  id: number
  name: string
  discountLabel: string
  description?: string
  minPurchaseLabel?: string
  expiryLabel?: string
  isEligible?: boolean
}

type CheckoutDiscountPanelProps = {
  discounts?: CheckoutDiscountOption[]
  selectedDiscountId?: number | null
  onDiscountChange?: (discountId: number | null) => void
}

export function CheckoutDiscountPanel({
  discounts = [],
  selectedDiscountId = null,
  onDiscountChange,
}: CheckoutDiscountPanelProps) {
  const canSelectDiscount = Boolean(onDiscountChange)

  return (
    <section className='checkout-panel'>
      <div className='checkout-section-title'>
        <BadgePercent aria-hidden='true' />
        <div>
          <h2>Diskon</h2>
          <p>Pilih diskon aktif yang ingin dipakai untuk pesanan ini.</p>
        </div>
      </div>

      {discounts.length === 0 ? (
        <div className='checkout-voucher-empty'>
          <BadgePercent aria-hidden='true' />
          <h3>Belum ada diskon</h3>
          <p>Diskon aktif setelah di kerjakan oleh feature 2</p>
        </div>
      ) : (
        <div className='checkout-payment-grid'>
          {discounts.map((discount) => {
            const isSelected = selectedDiscountId === discount.id
            const isEligible = discount.isEligible ?? true
            const isDisabled = !isEligible || !canSelectDiscount
            const discountCardClassName = [
              'checkout-payment-card',
              'checkout-voucher-card',
              isSelected ? 'selected' : '',
              isDisabled ? 'disabled' : '',
            ].filter(Boolean).join(' ')

            return (
              <button
                key={discount.id}
                type='button'
                className={discountCardClassName}
                disabled={isDisabled}
                onClick={() => onDiscountChange?.(isSelected ? null : discount.id)}
              >
                <div className='checkout-voucher-card-top'>
                  <BadgePercent aria-hidden='true' />
                  {isSelected && (
                    <span className='checkout-selection-badge'>
                      <CheckCircle2 aria-hidden='true' />
                      Terpasang
                    </span>
                  )}
                </div>
                <strong className='checkout-voucher-name'>{discount.name}</strong>
                <span className='checkout-voucher-discount'>{discount.discountLabel}</span>
                {discount.description && (
                  <span className='checkout-voucher-meta'>{discount.description}</span>
                )}
                {discount.minPurchaseLabel && (
                  <span className='checkout-voucher-meta'>
                    <strong>Min. Belanja:</strong> {discount.minPurchaseLabel}
                  </span>
                )}
                {discount.expiryLabel && (
                  <span className='checkout-voucher-expiry'>{discount.expiryLabel}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
