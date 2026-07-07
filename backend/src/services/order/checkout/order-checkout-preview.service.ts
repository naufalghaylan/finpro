import { PaymentMethod } from '../../../generated/prisma/client'
import { getCart } from '../../cart.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { getNearestActiveStore, getUserAddresses } from '../checkout/order-checkout-validation.service'
import { getAvailableCheckoutVouchers } from '../checkout/order-checkout-voucher.service'
import { getStoreDiscountBreakdownForCheckout, type AppliedCheckoutDiscount } from '../checkout/order-discount.service'
import type { CheckoutPreviewParams } from '../core/order.types'

const checkoutPaymentMethods = [
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
]

const getCheckoutPreviewResources = async (userId: number) => {
  const [cart, addresses, vouchers] = await Promise.all([
    getCart(userId),
    getUserAddresses(userId),
    getAvailableCheckoutVouchers(userId),
  ])

  return { cart, addresses, vouchers }
}

type CheckoutPreviewResources = Awaited<ReturnType<typeof getCheckoutPreviewResources>>
type CheckoutAddress = CheckoutPreviewResources['addresses'][number]
type CheckoutCart = CheckoutPreviewResources['cart']
type CheckoutStore = Awaited<ReturnType<typeof getNearestActiveStore>> | null

type StoreDiscountSummary = {
  storeDiscountAmount: number
  storeDiscounts: AppliedCheckoutDiscount[]
}

type CheckoutPreviewResponseParams = CheckoutPreviewResources & {
  selectedAddress: CheckoutAddress | null
  nearestStore: CheckoutStore
  discountSummary: StoreDiscountSummary
}

const selectCheckoutAddress = (addresses: CheckoutPreviewResources['addresses'], addressId?: number) =>
  addressId ? addresses.find((address) => address.id === addressId) : addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null

const assertSelectedAddress = (addressId: number | undefined, selectedAddress?: CheckoutAddress | null) => {
  if (addressId && !selectedAddress) {
    throw new OrderServiceError(ORDER_ERRORS.ADDRESS_NOT_FOUND, 'Address not found', 404)
  }
}

const resolveSelectedAddress = (addresses: CheckoutPreviewResources['addresses'], addressId?: number) => {
  const selectedAddress = selectCheckoutAddress(addresses, addressId)
  assertSelectedAddress(addressId, selectedAddress)
  return selectedAddress ?? null
}

const hasAddressCoordinates = (address: CheckoutAddress | null): address is CheckoutAddress & { latitude: number; longitude: number } =>
  Boolean(address && address.latitude !== null && address.longitude !== null)

const resolveNearestStore = async (selectedAddress: CheckoutAddress | null) => {
  if (!hasAddressCoordinates(selectedAddress)) return null
  return getNearestActiveStore(selectedAddress.latitude, selectedAddress.longitude)
}

const calculateTotalProductAmount = (cart: CheckoutCart) =>
  cart.items.reduce((total, item) => total + item.quantity * item.product.basePrice, 0)

const getEmptyDiscountSummary = (): StoreDiscountSummary => ({
  storeDiscountAmount: 0,
  storeDiscounts: [],
})

const resolveStoreDiscountSummary = async (nearestStore: CheckoutStore, cart: CheckoutCart) => {
  if (!nearestStore || cart.items.length === 0) return getEmptyDiscountSummary()
  const totalProductAmount = calculateTotalProductAmount(cart)
  const breakdown = await getStoreDiscountBreakdownForCheckout(nearestStore.id, cart.items, totalProductAmount)
  return { storeDiscountAmount: breakdown.totalDiscount, storeDiscounts: breakdown.appliedDiscounts }
}

const buildCheckoutCartPreview = (cart: CheckoutCart, storeDiscountAmount: number) => ({
  ...cart,
  summary: { ...cart.summary, storeDiscountAmount },
})

const buildCheckoutPreviewResponse = (params: CheckoutPreviewResponseParams) => ({
  cart: buildCheckoutCartPreview(params.cart, params.discountSummary.storeDiscountAmount),
  addresses: params.addresses,
  vouchers: params.vouchers,
  selectedAddress: params.selectedAddress,
  nearestStore: params.nearestStore,
  storeDiscounts: params.discountSummary.storeDiscounts,
  discountAmount: params.discountSummary.storeDiscountAmount,
  paymentMethods: checkoutPaymentMethods,
})

export const getCheckoutPreview = async ({ userId, addressId }: CheckoutPreviewParams) => {
  const resources = await getCheckoutPreviewResources(userId)
  const selectedAddress = resolveSelectedAddress(resources.addresses, addressId)
  const nearestStore = await resolveNearestStore(selectedAddress)
  const discountSummary = await resolveStoreDiscountSummary(nearestStore, resources.cart)
  return buildCheckoutPreviewResponse({ ...resources, selectedAddress, nearestStore, discountSummary })
}
