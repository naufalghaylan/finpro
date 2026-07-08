import { formatCurrency } from '../../utils/format'

type CheckoutMobileCreateOrderBarProps = {
  canCreateOrder: boolean
  isSubmitting: boolean
  totalPayment: number
  onCreateOrder: () => void
}

export function CheckoutMobileCreateOrderBar(props: CheckoutMobileCreateOrderBarProps) {
  return (
    <div className="checkout-mobile-bar">
      <div>
        <span>Total Bayar</span>
        <strong>{formatCurrency(props.totalPayment)}</strong>
      </div>
      <button type="button" className="button primary" disabled={!props.canCreateOrder} onClick={props.onCreateOrder}>
        {props.isSubmitting ? 'Membuat...' : 'Buat Pesanan'}
      </button>
    </div>
  )
}
