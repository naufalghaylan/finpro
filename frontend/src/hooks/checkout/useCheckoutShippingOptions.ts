import { useCallback, useEffect, useState } from 'react'
import { calculateShippingCost, type ShippingCostResult } from '../../api/rajaongkir'
import type { CheckoutPreview } from '../../types/order'

const calculateRoundedWeight = (weightInGrams: number): number => {
  const kg = Math.floor(weightInGrams / 1000)
  const remainder = weightInGrams % 1000
  
  if (remainder <= 300) {
    return Math.max(1000, kg * 1000)
  } else {
    return (kg + 1) * 1000
  }
}

export function useCheckoutShippingOptions(
  preview: CheckoutPreview | null,
  selectedAddressId: number | null,
  totalWeight: number,
) {
  const [selectedCourier, setSelectedCourier] = useState<string>('')
  const [courierServices, setCourierServices] = useState<Record<string, ShippingCostResult[]>>({})
  const [selectedShippingService, setSelectedShippingService] = useState<ShippingCostResult | null>(null)
  const [fetchingCouriers, setFetchingCouriers] = useState<Record<string, boolean>>({})

  const [shippingError, setShippingError] = useState<string | null>(null)

  const fetchShippingForCourier = useCallback(async (courierCode: string) => {
    if (!selectedAddressId || !preview?.nearestStore) return

    setFetchingCouriers(prev => ({ ...prev, [courierCode]: true }))
    setShippingError(null)
    
    try {
      const roundedWeight = calculateRoundedWeight(totalWeight)
      const results = await calculateShippingCost({
        addressId: selectedAddressId,
        storeId: preview.nearestStore.id,
        weight: roundedWeight,
        courier: courierCode,
      })
      
      setCourierServices(prev => ({ ...prev, [courierCode]: results || [] }))
    } catch (error: any) {
      // Ignore individual courier errors (e.g. unsupported route)
      setCourierServices(prev => ({ ...prev, [courierCode]: [] }))
      if (error.response?.status === 400) {
        setShippingError('Kota tidak ditemukan atau tidak didukung oleh toko. Silakan pilih alamat lain atau buat alamat baru.')
      }
    } finally {
      setFetchingCouriers(prev => ({ ...prev, [courierCode]: false }))
    }
  }, [selectedAddressId, preview, totalWeight])

  useEffect(() => {
    if (!selectedAddressId || !preview?.nearestStore) {
      window.setTimeout(() => {
        setCourierServices({})
        setSelectedCourier('')
        setSelectedShippingService(null)
      }, 0)
      return
    }

    // Reset courier services when address or weight changes using setTimeout
    // to avoid synchronous cascading renders inside useEffect
    window.setTimeout(() => {
      setCourierServices({})
      setSelectedShippingService(null)
      setSelectedCourier('jne') // Set default selected courier
      void fetchShippingForCourier('jne')
    }, 0)
  }, [selectedAddressId, preview, totalWeight, fetchShippingForCourier])

  return {
    selectedCourier,
    setSelectedCourier,
    courierServices,
    selectedShippingService,
    setSelectedShippingService,
    fetchingCouriers,
    shippingError,
    fetchShippingForCourier,
  }
}
