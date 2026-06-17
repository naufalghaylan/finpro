import { AlertCircle, Loader2, Truck, CheckCircle2 } from 'lucide-react'
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
    (courier) => courierServices[courier.code] !== undefined && courierServices[courier.code].length > 0
  )
  const shippingCosts = courierServices[selectedCourier] || []

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
            {visibleCouriers.map((courier) => {
              const isSelected = selectedCourier === courier.code;
              return (
                <label
                  key={courier.code}
                  className={`checkout-courier-card ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="courier"
                    checked={isSelected}
                    onChange={() => onCourierChange(courier.code)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={20} color={isSelected ? 'var(--accent-strong)' : 'var(--ink-soft)'} aria-hidden="true" />
                      <strong style={{ color: isSelected ? 'var(--accent-strong)' : 'var(--ink)' }}>{courier.label}</strong>
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="var(--accent-strong)" />}
                  </div>
                </label>
              );
            })}
          </div>

          {isFetchingShipping ? (
            <div className="checkout-inline-alert">
              <Loader2 className="button-icon spin" aria-hidden="true" />
              Memuat kurir yang tersedia...
            </div>
          ) : shippingCosts.length > 0 ? (
            <div className="checkout-shipping-service-grid">
              {shippingCosts.map((service, idx) => {
                const isSelected = selectedShippingService?.service === service.service;
                return (
                  <label
                    key={idx}
                    className={`checkout-shipping-service-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      background: isSelected ? 'rgba(232, 107, 79, 0.04)' : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      name="shippingService"
                      checked={isSelected}
                      onChange={() => onShippingServiceChange(service)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '1.1rem', color: isSelected ? 'var(--accent-strong)' : 'var(--ink)' }}>{service.service}</strong>
                          <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: '2px' }}>{service.description}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={20} color="var(--accent-strong)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                      </div>
                      
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '12px', borderTop: '1px dashed var(--line)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Estimasi Tiba</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                            {formatEtdText(service.etd)}
                          </span>
                        </div>
                        <strong style={{ color: 'var(--accent-strong)', fontSize: '1.15rem' }}>
                          {formatCurrency(service.cost)}
                        </strong>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : selectedCourier ? (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Layanan pengiriman tidak tersedia.
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
