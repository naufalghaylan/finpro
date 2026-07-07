import { TicketPercent } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import type { CheckoutVoucher } from '../../types/order'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'
import { CheckoutVoucherCard } from './CheckoutVoucherCard'
import { CheckoutVoucherEmptyState } from './CheckoutVoucherEmptyState'
import { getVoucherDiscountPreview } from './checkoutVoucher'

type CheckoutVoucherPanelProps = {
  vouchers: CheckoutVoucher[]
  items: CartItem[]
  subtotal: number
  shippingCost: number
  selectedVoucherId: number | null
  onVoucherChange: (voucherId: number | null) => void
}

export function CheckoutVoucherPanel(props: CheckoutVoucherPanelProps) {
  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={TicketPercent} title="Voucher" description="Pakai voucher aktif dari akunmu untuk pesanan ini." />
      {props.vouchers.length === 0 ? <CheckoutVoucherEmptyState /> : <VoucherGrid {...props} />}
    </section>
  )
}

function VoucherGrid(props: CheckoutVoucherPanelProps) {
  return (
    <div className="checkout-payment-grid">
      {props.vouchers.map((voucher) => <VoucherCardConnector key={voucher.id} voucher={voucher} {...props} />)}
    </div>
  )
}

function VoucherCardConnector(props: CheckoutVoucherPanelProps & { voucher: CheckoutVoucher }) {
  const discountPreview = getVoucherDiscountPreview(props.voucher, props.items, props.subtotal, props.shippingCost)

  return (
    <CheckoutVoucherCard
      voucher={props.voucher}
      discountPreview={discountPreview}
      isSelected={props.selectedVoucherId === props.voucher.id}
      onVoucherChange={props.onVoucherChange}
    />
  )
}
