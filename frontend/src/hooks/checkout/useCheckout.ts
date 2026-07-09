import { useMemo, useState } from 'react'
import type { PaymentMethod } from '../../types/order'
import { useCheckoutPreview } from './useCheckoutPreview'
import { useCheckoutShippingOptions } from './useCheckoutShippingOptions'
import { useCheckoutPaymentSummary } from './useCheckoutPaymentSummary'
import { useCreateCheckoutOrder } from './useCreateCheckoutOrder'

export function useCheckout() {
  const {
    preview,
    selectedAddressId,
    setSelectedAddressId,
    isLoading,
    isRefreshingPreview,
    fetchError,
    loadPreview,
  } = useCheckoutPreview()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_TRANSFER')
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  // Diskon toko opt-in: default tidak dipakai; user memilih mengaktifkannya.
  const [useStoreDiscount, setUseStoreDiscount] = useState(false)

  const error = fetchError?.message ?? null

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
  const activeSelectedVoucherId = selectedVoucher?.id ?? null

  const totalWeight = useMemo(() => {
    return preview?.cart.items.reduce((acc, item) => acc + (item.product.weight * item.quantity), 0) ?? 0
  }, [preview?.cart.items])

  const {
    selectedCourier,
    setSelectedCourier,
    courierServices,
    selectedShippingService,
    setSelectedShippingService,
    fetchingCouriers,
    shippingError,
    fetchShippingForCourier,
  } = useCheckoutShippingOptions(preview, selectedAddressId, totalWeight)

  const paymentSummary = useCheckoutPaymentSummary(preview, selectedVoucher, selectedShippingService, useStoreDiscount)

  const {
    createdOrder,
    isSubmitting,
    handleCreateOrder,
  } = useCreateCheckoutOrder({
    selectedAddressId,
    canCreateOrder: Boolean(selectedAddressId) &&
      hasSelectedAddressCoordinates &&
      Boolean(preview?.nearestStore) &&
      !isCartEmpty &&
      !isRefreshingPreview &&
      Boolean(selectedShippingService), // isSubmitting is managed inside
    selectedShippingService,
    paymentMethod,
    selectedVoucherId: activeSelectedVoucherId,
    notes,
    applyStoreDiscount: useStoreDiscount,
  })

  // Re-evaluating canCreateOrder specifically for the returned object
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

  return {
    preview,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    selectedVoucherId: activeSelectedVoucherId,
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
    shippingError,
    paymentSummary,
    canCreateOrder,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    useStoreDiscount,
    setUseStoreDiscount,
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
