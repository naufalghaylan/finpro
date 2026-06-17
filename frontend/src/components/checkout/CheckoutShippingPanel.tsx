import { AlertCircle, Loader2, Truck } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'

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
  shippingCosts: ShippingCostResult[]
  selectedShippingService: ShippingCostResult | null
  isFetchingShipping: boolean
  onCourierChange: (courier: string) => void
  onShippingServiceChange: (service: ShippingCostResult) => void
}

export function CheckoutShippingPanel({
  hasSelectedAddressCoordinates,
  hasNearestStore,
  selectedCourier,
  shippingCosts,
  selectedShippingService,
  isFetchingShipping,
  onCourierChange,
  onShippingServiceChange,
}: CheckoutShippingPanelProps) {
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
          Store terdekat belum tersedia.
        </div>
      ) : (
        <div className="checkout-shipping-container">
          <div className="checkout-courier-grid">
            {AVAILABLE_COURIERS.map((courier) => (
              <label
                key={courier.code}
                className={`checkout-courier-card ${selectedCourier === courier.code ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="courier"
                  checked={selectedCourier === courier.code}
                  onChange={() => onCourierChange(courier.code)}
                />
                <strong>{courier.label}</strong>
              </label>
            ))}
          </div>

          {isFetchingShipping ? (
            <div className="checkout-inline-alert">
              <Loader2 className="button-icon spin" aria-hidden="true" />
              Memuat ongkos kirim...
            </div>
          ) : shippingCosts.length > 0 ? (
            <div className="checkout-shipping-service-grid">
              {shippingCosts.map((service, idx) => (
                <label
                  key={idx}
                  className={`checkout-shipping-service-card ${selectedShippingService?.service === service.service ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="shippingService"
                    checked={selectedShippingService?.service === service.service}
                    onChange={() => onShippingServiceChange(service)}
                  />
                  <div className="shipping-service-info">
                    <strong>{service.service}</strong>
                    <span>{service.description}</span>
                    <span>Estimasi: {service.etd}</span>
                  </div>
                  <strong className="shipping-service-cost">{formatCurrency(service.cost)}</strong>
                </label>
              ))}
            </div>
          ) : selectedCourier ? (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Layanan pengiriman tidak tersedia untuk kurir ini ke alamat tujuan.
            </div>
          ) : (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Pilih kurir untuk melihat tarif pengiriman.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
