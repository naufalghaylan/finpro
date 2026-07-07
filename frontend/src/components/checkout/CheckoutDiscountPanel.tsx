import { BadgePercent, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

type CheckoutDiscountPanelProps = {
  /** Diskon toko yang tersedia untuk pesanan ini (dihitung backend). */
  availableDiscountAmount?: number
  /** Apakah user memilih memakai diskon. */
  isApplied?: boolean
  onToggleApply?: (apply: boolean) => void
}

export function CheckoutDiscountPanel({
  availableDiscountAmount = 0,
  isApplied = false,
  onToggleApply,
}: CheckoutDiscountPanelProps) {
  const hasDiscount = availableDiscountAmount > 0

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
        <button
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
                Dipakai
              </span>
            )}
          </div>
          <strong className='checkout-voucher-name'>Diskon Toko</strong>
          <span className='checkout-voucher-discount'>Hemat {formatCurrency(availableDiscountAmount)}</span>
          <span className='checkout-voucher-meta'>
            {isApplied
              ? 'Diskon dipakai untuk pesanan ini. Klik untuk membatalkan.'
              : 'Klik untuk memakai diskon ini.'}
          </span>
        </button>
      )}
    </section>
  )
}
