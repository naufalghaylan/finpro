import type { ShippingCostResult } from '../../api/rajaongkir'

export type CourierOption = {
  code: string
  label: string
}

export const AVAILABLE_COURIERS: CourierOption[] = [
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

export const formatEtdText = (etd: string | undefined | null) => {
  const cleaned = etd ? etd.trim().toLowerCase() : ''
  if (isSameDayEtd(cleaned)) return 'Tiba hari ini'

  return normalizeEtdText(etd!)
}

const isSameDayEtd = (etd: string) =>
  !etd || etd === '-' || etd === '0' || etd === '0 hari' || etd.includes('0 day')

const normalizeEtdText = (etd: string) => {
  const formatted = etd.replace(/days?/ig, 'hari').trim()
  return formatted.toLowerCase().includes('hari') ? formatted : `${formatted} hari`
}

export const findSelectedService = (
  services: ShippingCostResult[],
  selectedShippingService: ShippingCostResult | null,
  courierCode: string,
) => services.find((service) => selectedShippingService?.service === service.service && selectedShippingService?.code === courierCode)

export const isSelectedShippingService = (
  service: ShippingCostResult,
  selectedShippingService: ShippingCostResult | null,
  courierCode: string,
) => selectedShippingService?.service === service.service && selectedShippingService?.code === courierCode
