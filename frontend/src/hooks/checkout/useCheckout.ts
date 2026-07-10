import { useMemo, useState } from 'react'
import type { PaymentMethod } from '../../types/order'
import { useCheckoutPreview } from './useCheckoutPreview'
import { useCheckoutShippingOptions } from './useCheckoutShippingOptions'
import { useCheckoutPaymentSummary } from './useCheckoutPaymentSummary'
import { useCreateCheckoutOrder } from './useCreateCheckoutOrder'
import { getCartBlockingReason } from '../../utils/cartAvailability'

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
  // Diskon toko: user memilih maksimal satu (diskon per-produk tetap otomatis).
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null)

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
  const cartBlockingReason = useMemo(() => getCartBlockingReason(preview?.cart.items ?? []), [preview?.cart.items])
  const selectedVoucher = useMemo(
    () => (preview?.vouchers ?? []).find((voucher) => voucher.id === selectedVoucherId) ?? null,
    [preview?.vouchers, selectedVoucherId],
  )
  const activeSelectedVoucherId = selectedVoucher?.id ?? null

  // Diskon toko terpilih divalidasi terhadap daftar yang tersedia (bisa berubah saat alamat berganti).
  const selectedStoreDiscount = useMemo(
    () => (preview?.availableStoreDiscounts ?? []).find((discount) => discount.id === selectedDiscountId) ?? null,
    [preview?.availableStoreDiscounts, selectedDiscountId],
  )
  const activeSelectedDiscountId = selectedStoreDiscount?.id ?? null

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

  const paymentSummary = useCheckoutPaymentSummary(preview, selectedVoucher, selectedShippingService, selectedStoreDiscount)

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
      !cartBlockingReason &&
      Boolean(selectedShippingService), // isSubmitting is managed inside
    selectedShippingService,
    paymentMethod,
    selectedVoucherId: activeSelectedVoucherId,
    notes,
    discountId: activeSelectedDiscountId,
  })

  // Re-evaluating canCreateOrder specifically for the returned object
  const canCreateOrder =
    Boolean(selectedAddressId) &&
    hasSelectedAddressCoordinates &&
    Boolean(preview?.nearestStore) &&
    !isCartEmpty &&
    !isRefreshingPreview &&
    !isSubmitting &&
    !cartBlockingReason &&
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
    cartBlockingReason,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    selectedDiscountId: activeSelectedDiscountId,
    setSelectedDiscountId,
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
