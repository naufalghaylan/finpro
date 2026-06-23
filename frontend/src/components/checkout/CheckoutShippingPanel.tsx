import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Truck } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'

const formatEtdText = (etd: string | undefined | null) => {
  const cleaned = etd ? etd.trim().toLowerCase() : ''
  if (!cleaned || cleaned === '-' || cleaned === '0' || cleaned === '0 hari' || cleaned.includes('0 day')) {
    return 'Tiba hari ini'
  }

  let formatted = etd!.replace(/days?/ig, 'hari').trim()
  if (!formatted.toLowerCase().includes('hari')) {
    formatted = `${formatted} hari`
  }
  return formatted
}

const AVAILABLE_COURIERS = [
  { code: 'jne', label: 'JNE' },
  { code: 'pos', label: 'POS Indonesia' },
  { code: 'tiki', label: 'TIKI' },
  { code: 'sicepat', label: 'SiCepat' },
  { code: 'jnt', label: 'J&T Express' },
  { code: 'anteraja', label: 'AnterAja' },
  { code: 'ninja', label: 'Ninja Xpress' },
  { code: 'idexpress', label: 'ID Express' },
  { code: 'sap', label: 'SAP Express' },
]

interface CheckoutShippingPanelProps {
  hasSelectedAddressCoordinates: boolean
  hasNearestStore: boolean
  selectedCourier: string
  courierServices: Record<string, ShippingCostResult[]>
  selectedShippingService: ShippingCostResult | null
  isFetchingShipping: boolean
  onCourierChange: (courier: string) => void
  onShippingServiceChange: (service: ShippingCostResult) => void
}

export function CheckoutShippingPanel({
  hasSelectedAddressCoordinates,
  hasNearestStore,
  selectedCourier,
  courierServices,
  selectedShippingService,
  isFetchingShipping,
  onCourierChange,
  onShippingServiceChange,
}: CheckoutShippingPanelProps) {
  const visibleCouriers = AVAILABLE_COURIERS.filter(
    (courier) => courierServices[courier.code] !== undefined && courierServices[courier.code].length > 0,
  )

  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <Truck aria-hidden="true" />
        <div>
          <h2>Metode Pengiriman</h2>
          <p>Pilih kurir dan layanan pengiriman untuk pesanan ini.</p>
        </div>
      </div>

      {!hasSelectedAddressCoordinates ? (
        <div className="checkout-inline-alert">
          <AlertCircle aria-hidden="true" />
          Pilih alamat dengan koordinat untuk menampilkan metode pengiriman.
        </div>
      ) : !hasNearestStore ? (
        <div className="checkout-inline-alert">
          <AlertCircle aria-hidden="true" />
          Cabang PanenMart belum tersedia untuk alamat ini.
        </div>
      ) : (
        <div className="checkout-shipping-container">
          {isFetchingShipping ? (
            <div className="checkout-inline-alert">
              <Loader2 className="button-icon spin" aria-hidden="true" />
              Memuat kurir yang tersedia...
            </div>
          ) : visibleCouriers.length > 0 ? (
            <div className="checkout-courier-list">
              {visibleCouriers.map((courier) => {
                const isExpanded = selectedCourier === courier.code
                const shippingCosts = courierServices[courier.code] || []
                const selectedServiceInThisCourier = shippingCosts.find(
                  (service) => selectedShippingService?.service === service.service,
                )

                return (
                  <div
                    key={courier.code}
                    className={`checkout-courier-option ${isExpanded ? 'expanded' : ''} ${selectedServiceInThisCourier ? 'has-selection' : ''}`}
                  >
                    <button
                      type="button"
                      className="checkout-courier-trigger"
                      onClick={() => onCourierChange(isExpanded ? '' : courier.code)}
                      aria-expanded={isExpanded}
                    >
                      <div className="checkout-courier-main">
                        <Truck className="checkout-courier-icon" aria-hidden="true" />
                        <strong>{courier.label}</strong>
                        {selectedServiceInThisCourier && !isExpanded && (
                          <span className="checkout-courier-selected-badge">
                            {selectedServiceInThisCourier.service} - {formatCurrency(selectedServiceInThisCourier.cost)}
                          </span>
                        )}
                      </div>
                      <div className="checkout-courier-actions">
                        {selectedServiceInThisCourier && <CheckCircle2 className="checkout-courier-check" aria-hidden="true" />}
                        {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="checkout-courier-services">
                        {shippingCosts.length > 0 ? (
                          <div className="checkout-shipping-service-grid">
                            {shippingCosts.map((service, index) => {
                              const isSelected = selectedShippingService?.service === service.service
                              return (
                                <label
                                  key={`${service.service}-${index}`}
                                  className={`checkout-shipping-service-card ${isSelected ? 'selected' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name="shippingService"
                                    checked={isSelected}
                                    onChange={() => onShippingServiceChange(service)}
                                  />
                                  <div className="checkout-shipping-service-content">
                                    <div className="checkout-shipping-service-top">
                                      <div className="checkout-shipping-service-info">
                                        <strong>{service.service}</strong>
                                        <span>{service.description || 'Layanan pengiriman'}</span>
                                      </div>
                                      {isSelected && <CheckCircle2 className="checkout-shipping-selected-icon" aria-hidden="true" />}
                                    </div>

                                    <div className="checkout-shipping-service-bottom">
                                      <div className="checkout-shipping-service-etd">
                                        <span>Estimasi Tiba</span>
                                        <strong>{formatEtdText(service.etd)}</strong>
                                      </div>
                                      <strong className="checkout-shipping-service-cost">
                                        {formatCurrency(service.cost)}
                                      </strong>
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="checkout-inline-alert compact">
                            <AlertCircle aria-hidden="true" />
                            Layanan pengiriman tidak tersedia untuk kurir ini.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Pilih alamat tujuan untuk melihat tarif pengiriman dari cabang terdekat.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
