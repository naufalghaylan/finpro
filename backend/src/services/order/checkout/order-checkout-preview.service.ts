import { PaymentMethod } from '../../../generated/prisma/client'
import { getCart } from '../../cart.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { getNearestActiveStore, getUserAddresses } from '../checkout/order-checkout-validation.service'
import { getAvailableCheckoutVouchers } from '../checkout/order-checkout-voucher.service'
import { getStoreDiscountBreakdownForCheckout, type AppliedCheckoutDiscount } from '../checkout/order-discount.service'
import type { CheckoutPreviewParams } from '../core/order.types'

export const getCheckoutPreview = async ({ userId, addressId }: CheckoutPreviewParams) => {
  const [cart, addresses, vouchers] = await Promise.all([
    getCart(userId),
    getUserAddresses(userId),
    getAvailableCheckoutVouchers(userId),
  ])
  const selectedAddress = addressId
    ? addresses.find((address) => address.id === addressId)
    : addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null

  if (addressId && !selectedAddress) {
    throw new OrderServiceError(ORDER_ERRORS.ADDRESS_NOT_FOUND, 'Address not found', 404)
  }

  const nearestStore =
    selectedAddress && selectedAddress.latitude !== null && selectedAddress.longitude !== null
      ? await getNearestActiveStore(selectedAddress.latitude, selectedAddress.longitude)
      : null

  let storeDiscountAmount = 0
  let storeDiscounts: AppliedCheckoutDiscount[] = []
  if (nearestStore && cart && cart.items.length > 0) {
    const totalProductAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.product.basePrice,
      0,
    )
    const storeDiscountBreakdown = await getStoreDiscountBreakdownForCheckout(
      nearestStore.id,
      cart.items,
      totalProductAmount,
    )
    storeDiscountAmount = storeDiscountBreakdown.totalDiscount
    storeDiscounts = storeDiscountBreakdown.appliedDiscounts
  }

  return {
    // Sisipkan diskon-toko ke dalam summary keranjang, karena di situlah frontend
    // (useCheckoutPaymentSummary & CheckoutSummaryPanel) membacanya.
    cart: {
      ...cart,
      summary: { ...cart.summary, storeDiscountAmount },
    },
    addresses,
    vouchers,
    selectedAddress,
    nearestStore,
    storeDiscounts,
    discountAmount: storeDiscountAmount,
    paymentMethods: [
      {
        value: PaymentMethod.MANUAL_TRANSFER,
        label: 'Transfer Manual',
        description: 'Pesanan menunggu upload bukti bayar sebelum diproses admin.',
      },
      {
        value: PaymentMethod.PAYMENT_GATEWAY,
        label: 'Payment Gateway',
        description: 'Pembayaran melalui Midtrans Sandbox dan diproses otomatis setelah pembayaran berhasil.',
      },
    ],
  }
}
