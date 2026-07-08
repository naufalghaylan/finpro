import { CreditCard, WalletCards } from 'lucide-react'
import type { PaymentMethod } from '../../types/order'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'

interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  description: string
}

interface CheckoutPaymentPanelProps {
  paymentMethods: PaymentMethodOption[]
  selectedPaymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
}

const paymentMethodDisplay: Record<PaymentMethod, { label: string; description: string }> = {
  MANUAL_TRANSFER: { label: 'Transfer Manual', description: 'Unggah bukti bayar setelah pesanan dibuat.' },
  PAYMENT_GATEWAY: { label: 'Pembayaran Online', description: 'Bayar online dan status pesanan diperbarui otomatis.' },
}

export function CheckoutPaymentPanel(props: CheckoutPaymentPanelProps) {
  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={CreditCard} title="Metode Pembayaran" description="Pilih cara bayar yang paling nyaman untuk menyelesaikan pesanan." />
      <PaymentMethodGrid {...props} />
    </section>
  )
}

function PaymentMethodGrid(props: CheckoutPaymentPanelProps) {
  return <div className="checkout-payment-grid">{props.paymentMethods.map((method) => <PaymentMethodCard key={method.value} method={method} {...props} />)}</div>
}

function PaymentMethodCard({ method, selectedPaymentMethod, onPaymentMethodChange }: CheckoutPaymentPanelProps & { method: PaymentMethodOption }) {
  const display = paymentMethodDisplay[method.value]

  return (
    <label className={`checkout-payment-card ${selectedPaymentMethod === method.value ? 'selected' : ''}`}>
      <input type="radio" name="paymentMethod" checked={selectedPaymentMethod === method.value} onChange={() => onPaymentMethodChange(method.value)} />
      <PaymentMethodIcon paymentMethod={method.value} />
      <strong>{display.label}</strong>
      <span>{display.description}</span>
    </label>
  )
}

function PaymentMethodIcon({ paymentMethod }: { paymentMethod: PaymentMethod }) {
  return paymentMethod === 'PAYMENT_GATEWAY'
    ? <CreditCard aria-hidden="true" />
    : <WalletCards aria-hidden="true" />
}
