import { CheckCircle2 } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'
import { formatEtdText } from './checkoutShippingDisplay'

type CheckoutShippingServiceCardProps = {
  service: ShippingCostResult
  isSelected: boolean
  onShippingServiceChange: (service: ShippingCostResult) => void
}

export function CheckoutShippingServiceCard(props: CheckoutShippingServiceCardProps) {
  return (
    <label className={`checkout-shipping-service-card ${props.isSelected ? 'selected' : ''}`}>
      <input type="radio" name="shippingService" checked={props.isSelected} onChange={() => props.onShippingServiceChange(props.service)} />
      <ShippingServiceContent {...props} />
    </label>
  )
}

function ShippingServiceContent({ service, isSelected }: CheckoutShippingServiceCardProps) {
  return (
    <div className="checkout-shipping-service-content">
      <ShippingServiceTop service={service} isSelected={isSelected} />
      <ShippingServiceBottom service={service} />
    </div>
  )
}

function ShippingServiceTop({ service, isSelected }: Pick<CheckoutShippingServiceCardProps, 'service' | 'isSelected'>) {
  return (
    <div className="checkout-shipping-service-top">
      <div className="checkout-shipping-service-info"><strong>{service.service}</strong><span>{service.description || 'Layanan pengiriman'}</span></div>
      {isSelected && <CheckCircle2 className="checkout-shipping-selected-icon" aria-hidden="true" />}
    </div>
  )
}

function ShippingServiceBottom({ service }: Pick<CheckoutShippingServiceCardProps, 'service'>) {
  return (
    <div className="checkout-shipping-service-bottom">
      <div className="checkout-shipping-service-etd"><span>Estimasi Tiba</span><strong>{formatEtdText(service.etd)}</strong></div>
      <strong className="checkout-shipping-service-cost">{formatCurrency(service.cost)}</strong>
    </div>
  )
}
