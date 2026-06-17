import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutOrder, getCheckoutPreview } from '../../api/order.api'
import { calculateShippingCost, type ShippingCostResult } from '../../api/rajaongkir'
import { useToast } from '../../components/common/toastContext'
import { useCartStore } from '../../store/cartStore'
import type { CheckoutOrder, CheckoutPreview, PaymentMethod } from '../../types/order'
import { getApiErrorMessage } from '../../utils/apiError'

const getErrorMessage = (error: unknown) => getApiErrorMessage(error, 'Gagal memproses checkout')

export function useCheckout() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_TRANSFER')
  const [notes, setNotes] = useState('')
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCourier, setSelectedCourier] = useState<string>('')
  const [shippingCosts, setShippingCosts] = useState<ShippingCostResult[]>([])
  const [selectedShippingService, setSelectedShippingService] = useState<ShippingCostResult | null>(null)
  const [isFetchingShipping, setIsFetchingShipping] = useState(false)
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

  const totalWeight = useMemo(() => {
    return preview?.cart.items.reduce((acc, item) => acc + (item.product.weight * item.quantity), 0) ?? 0
  }, [preview?.cart.items])

  const paymentSummary = useMemo(() => {
    const subtotal = preview?.cart.summary.subtotal ?? 0
    const shippingCost = selectedShippingService?.cost ?? 0

    return {
      subtotal,
      shippingCost,
      totalPayment: Math.max(0, subtotal + shippingCost),
    }
  }, [preview?.cart.summary.subtotal, selectedShippingService])

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
    if (!selectedAddressId || !preview?.nearestStore || !selectedCourier || totalWeight === 0) {
      window.setTimeout(() => {
        setShippingCosts([])
        setSelectedShippingService(null)
      }, 0)
      return
    }

    const fetchShippingCosts = async () => {
      setIsFetchingShipping(true)
      try {
        const results = await calculateShippingCost({
          addressId: selectedAddressId,
          storeId: preview.nearestStore!.id,
          weight: Math.max(1, Math.ceil(totalWeight)),
          courier: selectedCourier,
        })
        setShippingCosts(results)
        setSelectedShippingService(null)
      } catch (err) {
        showToast('Gagal memuat ongkos kirim. Silakan coba kurir lain.', 'error')
        setShippingCosts([])
        setSelectedShippingService(null)
      } finally {
        setIsFetchingShipping(false)
      }
    }

    void fetchShippingCosts()
  }, [selectedAddressId, preview?.nearestStore, selectedCourier, totalWeight, showToast])

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
    notes,
    createdOrder,
    isLoading,
    isRefreshingPreview,
    isSubmitting,
    error,
    selectedCourier,
    shippingCosts,
    selectedShippingService,
    isFetchingShipping,
    paymentSummary,
    canCreateOrder,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    setPaymentMethod,
    setNotes,
    setSelectedCourier,
    setSelectedShippingService,
    handleAddressChange,
    handleCreateOrder,
    loadPreview,
  }
}
