import { CreditCard, WalletCards } from 'lucide-react'
import type { PaymentMethod } from '../../types/order'

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

const getPaymentIcon = (paymentMethod: PaymentMethod) =>
  paymentMethod === 'PAYMENT_GATEWAY' ? CreditCard : WalletCards

export function CheckoutPaymentPanel({
  paymentMethods,
  selectedPaymentMethod,
  onPaymentMethodChange,
}: CheckoutPaymentPanelProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <CreditCard aria-hidden="true" />
        <div>
          <h2>Metode Pembayaran</h2>
          <p>Transfer manual menunggu upload bukti bayar, payment gateway langsung masuk proses.</p>
        </div>
      </div>

      <div className="checkout-payment-grid">
        {paymentMethods.map((method) => {
          const Icon = getPaymentIcon(method.value)

          return (
            <label
              key={method.value}
              className={`checkout-payment-card ${selectedPaymentMethod === method.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedPaymentMethod === method.value}
                onChange={() => onPaymentMethodChange(method.value)}
              />
              <Icon aria-hidden="true" />
              <strong>{method.label}</strong>
              <span>{method.description}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
