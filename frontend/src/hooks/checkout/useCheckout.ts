import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutOrder, getCheckoutPreview } from '../../api/order.api'
import { calculateShippingCost, type ShippingCostResult } from '../../api/rajaongkir'
import { getVoucherDiscountPreview } from '../../components/checkout/checkoutVoucher'
import { useToast } from '../../components/common/toastContext'
import { useCartStore } from '../../store/cartStore'
import type { CheckoutOrder, CheckoutPreview, PaymentMethod } from '../../types/order'
import { getApiErrorMessage } from '../../utils/apiError'

const getErrorMessage = (error: unknown) => getApiErrorMessage(error, 'Gagal memproses checkout')

const calculateRoundedWeight = (weightInGrams: number): number => {
  const kg = Math.floor(weightInGrams / 1000)
  const remainder = weightInGrams % 1000
  
  if (remainder <= 300) {
    return Math.max(1000, kg * 1000)
  } else {
    return (kg + 1) * 1000
  }
}


export function useCheckout() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_TRANSFER')
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCourier, setSelectedCourier] = useState<string>('')
  const [courierServices, setCourierServices] = useState<Record<string, ShippingCostResult[]>>({})
  const [selectedShippingService, setSelectedShippingService] = useState<ShippingCostResult | null>(null)
  const [fetchingCouriers, setFetchingCouriers] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()
  const navigate = useNavigate()
  const setCartCount = useCartStore((state) => state.setCartCount)

  const loadPreview = useCallback(async (addressId?: number, showInitialLoading = false) => {
    if (showInitialLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshingPreview(true)
    }

    try {
      const nextPreview = await getCheckoutPreview(addressId)
      setPreview(nextPreview)
      setSelectedAddressId(nextPreview.selectedAddress?.id ?? null)
      setError(null)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
      setIsRefreshingPreview(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadPreview(undefined, true)
    }, 0)

    return () => {
      window.clearTimeout(initialLoadId)
    }
  }, [loadPreview])

  const selectedAddress = useMemo(
    () => preview?.addresses.find((address) => address.id === selectedAddressId) ?? null,
    [preview?.addresses, selectedAddressId],
  )
  const hasSelectedAddressCoordinates =
    selectedAddress?.latitude !== null &&
    selectedAddress?.latitude !== undefined &&
    selectedAddress.longitude !== null &&
    selectedAddress.longitude !== undefined
  const isCartEmpty = (preview?.cart.items.length ?? 0) === 0
  const selectedVoucher = useMemo(
    () => (preview?.vouchers ?? []).find((voucher) => voucher.id === selectedVoucherId) ?? null,
    [preview?.vouchers, selectedVoucherId],
  )

  const totalWeight = useMemo(() => {
    return preview?.cart.items.reduce((acc, item) => acc + (item.product.weight * item.quantity), 0) ?? 0
  }, [preview?.cart.items])

  const paymentSummary = useMemo(() => {
    const subtotal = preview?.cart.summary.subtotal ?? 0
    const shippingCost = selectedShippingService?.cost ?? 0
    const storeDiscountAmount = preview?.cart.summary.storeDiscountAmount ?? 0
    const selectedVoucherAmount = selectedVoucher && preview
      ? getVoucherDiscountPreview(selectedVoucher, preview.cart.items, subtotal, shippingCost)
      : 0
    const voucherReferralAmount = selectedVoucher?.source === 'REFERRAL'
      ? selectedVoucherAmount
      : preview?.cart.summary.voucherReferralAmount ?? 0
    const discountAmount =
      preview?.cart.summary.discountAmount ??
      storeDiscountAmount + voucherReferralAmount + (selectedVoucher?.source !== 'REFERRAL' ? selectedVoucherAmount : 0)

    return {
      subtotal,
      shippingCost,
      storeDiscountAmount,
      voucherReferralAmount,
      discountAmount,
      totalPayment: Math.max(0, subtotal - discountAmount + shippingCost),
    }
  }, [
    preview?.cart.summary.discountAmount,
    preview?.cart.summary.storeDiscountAmount,
    preview?.cart.summary.subtotal,
    preview?.cart.summary.voucherReferralAmount,
    preview?.cart.items,
    selectedVoucher,
    selectedShippingService,
  ])

  const canCreateOrder =
    Boolean(selectedAddressId) &&
    hasSelectedAddressCoordinates &&
    Boolean(preview?.nearestStore) &&
    !isCartEmpty &&
    !isRefreshingPreview &&
    !isSubmitting &&
    Boolean(selectedShippingService)

  const handleAddressChange = (addressId: number) => {
    setSelectedAddressId(addressId)
    void loadPreview(addressId)
  }

  useEffect(() => {
    if (selectedVoucherId && !selectedVoucher) {
      setSelectedVoucherId(null)
    }
  }, [selectedVoucher, selectedVoucherId])

  const fetchShippingForCourier = useCallback(async (courierCode: string) => {
    if (!selectedAddressId || !preview?.nearestStore || totalWeight === 0) return

    setFetchingCouriers(prev => ({ ...prev, [courierCode]: true }))
    
    try {
      const roundedWeight = calculateRoundedWeight(totalWeight)
      const results = await calculateShippingCost({
        addressId: selectedAddressId,
        storeId: preview.nearestStore.id,
        weight: roundedWeight,
        courier: courierCode,
      })
      
      setCourierServices(prev => ({ ...prev, [courierCode]: results || [] }))
    } catch {
      // Ignore individual courier errors (e.g. unsupported route)
      setCourierServices(prev => ({ ...prev, [courierCode]: [] }))
    } finally {
      setFetchingCouriers(prev => ({ ...prev, [courierCode]: false }))
    }
  }, [selectedAddressId, preview, totalWeight])

  useEffect(() => {
    if (!selectedAddressId || !preview?.nearestStore || totalWeight === 0) {
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

  const handleCreateOrder = async () => {
    if (!selectedAddressId || !canCreateOrder || !selectedShippingService) return

    setIsSubmitting(true)
    try {
      const result = await createCheckoutOrder({
        addressId: selectedAddressId,
        shippingMethod: selectedCourier,
        shippingService: selectedShippingService.service,
        shippingCost: selectedShippingService.cost,
        paymentMethod,
        voucherId: selectedVoucherId ?? undefined,
        notes: notes.trim() || undefined,
      })

      setCreatedOrder(result.order)
      setCartCount(result.cartCount)
      showToast('Pesanan berhasil dibuat', 'success')
      navigate(`/orders/${result.order.id}`)
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    preview,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    selectedVoucherId,
    notes,
    createdOrder,
    isLoading,
    isRefreshingPreview,
    isSubmitting,
    error,
    selectedCourier,
    courierServices,
    selectedShippingService,
    fetchingCouriers,
    paymentSummary,
    canCreateOrder,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    setPaymentMethod,
    setSelectedVoucherId,
    setNotes,
    setSelectedCourier,
    setSelectedShippingService,
    handleAddressChange,
    handleCreateOrder,
    loadPreview,
    fetchShippingForCourier,
  }
}
