import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Truck } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'
import { CheckoutInlineAlert } from './CheckoutInlineAlert'
import { CheckoutShippingServiceCard } from './CheckoutShippingServiceCard'
import { findSelectedService, isSelectedShippingService, type CourierOption } from './checkoutShippingDisplay'

type CheckoutCourierOptionProps = {
  courier: CourierOption
  selectedCourier: string
  courierServices: Record<string, ShippingCostResult[]>
  selectedShippingService: ShippingCostResult | null
  fetchingCouriers: Record<string, boolean>
  onCourierChange: (courier: string) => void
  onShippingServiceChange: (service: ShippingCostResult) => void
}

export function CheckoutCourierOption(props: CheckoutCourierOptionProps) {
  const state = getCourierState(props)
  return (
    <div className={`checkout-courier-option ${state.isExpanded ? 'expanded' : ''} ${state.selectedService ? 'has-selection' : ''}`}>
      <CourierTrigger {...props} {...state} />
      {state.isExpanded && <CourierServices {...props} shippingCosts={state.shippingCosts} />}
    </div>
  )
}

function getCourierState({ courier, selectedCourier, courierServices, selectedShippingService }: CheckoutCourierOptionProps) {
  const shippingCosts = courierServices[courier.code] || []
  const selectedService = findSelectedService(shippingCosts, selectedShippingService, courier.code)
  return { isExpanded: selectedCourier === courier.code, selectedService, shippingCosts }
}

type CourierTriggerProps = CheckoutCourierOptionProps & ReturnType<typeof getCourierState>

function CourierTrigger(props: CourierTriggerProps) {
  return (
    <button type="button" className="checkout-courier-trigger" onClick={() => props.onCourierChange(props.isExpanded ? '' : props.courier.code)} aria-expanded={props.isExpanded}>
      <CourierMain {...props} />
      <CourierActions isExpanded={props.isExpanded} hasSelection={Boolean(props.selectedService)} />
    </button>
  )
}

function CourierMain({ courier, selectedService, isExpanded }: CourierTriggerProps) {
  return (
    <div className="checkout-courier-main">
      <Truck className="checkout-courier-icon" aria-hidden="true" />
      <strong>{courier.label}</strong>
      {selectedService && !isExpanded && <SelectedServiceBadge service={selectedService} />}
    </div>
  )
}

function SelectedServiceBadge({ service }: { service: ShippingCostResult }) {
  return <span className="checkout-courier-selected-badge">{service.service} - {formatCurrency(service.cost)}</span>
}

function CourierActions({ isExpanded, hasSelection }: { isExpanded: boolean; hasSelection: boolean }) {
  const ToggleIcon = isExpanded ? ChevronUp : ChevronDown
  return <div className="checkout-courier-actions">{hasSelection && <CheckCircle2 className="checkout-courier-check" aria-hidden="true" />}<ToggleIcon aria-hidden="true" /></div>
}

type CourierServicesProps = CheckoutCourierOptionProps & {
  shippingCosts: ShippingCostResult[]
}

function CourierServices(props: CourierServicesProps) {
  if (props.fetchingCouriers[props.courier.code]) return <LoadingCourierServices />
  if (props.shippingCosts.length === 0) return <UnavailableCourierServices />
  return <ShippingServiceGrid {...props} />
}

function LoadingCourierServices() {
  return (
    <div className="checkout-courier-services">
      <div className="checkout-inline-alert">
        <Loader2 className="button-icon spin" aria-hidden="true" />
        Memuat layanan pengiriman...
      </div>
    </div>
  )
}

function UnavailableCourierServices() {
  return <div className="checkout-courier-services"><CheckoutInlineAlert icon={AlertCircle} compact>Layanan pengiriman tidak tersedia untuk kurir ini.</CheckoutInlineAlert></div>
}

function ShippingServiceGrid(props: CourierServicesProps) {
  return (
    <div className="checkout-courier-services">
      <div className="checkout-shipping-service-grid">
        {props.shippingCosts.map((service, index) => <ShippingServiceOption key={`${service.service}-${index}`} service={service} {...props} />)}
      </div>
    </div>
  )
}

function ShippingServiceOption(props: CourierServicesProps & { service: ShippingCostResult }) {
  const isSelected = isSelectedShippingService(props.service, props.selectedShippingService, props.courier.code)
  return <CheckoutShippingServiceCard service={props.service} isSelected={isSelected} onShippingServiceChange={props.onShippingServiceChange} />
}
