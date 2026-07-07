import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutOrder } from '../../api/order.api'
import { useToast } from '../../components/common/toastContext'
import { useCartStore } from '../../store/cartStore'
import type { CheckoutOrder, PaymentMethod } from '../../types/order'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { getApiErrorMessage } from '../../utils/apiError'

const getErrorMessage = (error: unknown) => getApiErrorMessage(error, 'Gagal memproses checkout')

export function useCreateCheckoutOrder({
  selectedAddressId,
  canCreateOrder,
  selectedShippingService,
  paymentMethod,
  selectedVoucherId,
  notes,
  applyStoreDiscount,
}: {
  selectedAddressId: number | null
  canCreateOrder: boolean
  selectedShippingService: ShippingCostResult | null
  paymentMethod: PaymentMethod
  selectedVoucherId: number | null
  notes: string
  applyStoreDiscount: boolean
}) {
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrder | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()
  const setCartCount = useCartStore((state) => state.setCartCount)

  const handleCreateOrder = async () => {
    if (!selectedAddressId || !canCreateOrder || !selectedShippingService) return

    setIsSubmitting(true)
    try {
      const result = await createCheckoutOrder({
        addressId: selectedAddressId,
        shippingMethod: selectedShippingService.code,
        shippingService: selectedShippingService.service,
        shippingCost: selectedShippingService.cost,
        paymentMethod,
        voucherId: selectedVoucherId ?? undefined,
        notes: notes.trim() || undefined,
        applyStoreDiscount,
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
    createdOrder,
    isSubmitting,
    handleCreateOrder,
  }
}
