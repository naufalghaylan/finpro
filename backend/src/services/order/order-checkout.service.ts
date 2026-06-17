import { OrderStatus, PaymentMethod } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { getCart } from '../cart.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { allocateStockForOrder, assertGlobalStockAvailable } from '../order-stock.service'
import { PAYMENT_DEADLINE_IN_MS } from './order.constants'
import { orderSelect } from './order.select'
import {
  generateOrderNumber,
  getAddressCoordinates,
  getCheckoutCart,
  getNearestActiveStore,
  getUserAddresses,
} from './order-checkout-validation.service'
import type { CheckoutPreviewParams, CreateCheckoutOrderParams } from './order.types'

export const getCheckoutPreview = async ({ userId, addressId }: CheckoutPreviewParams) => {
  const [cart, addresses] = await Promise.all([
    getCart(userId),
    getUserAddresses(userId),
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

  return {
    cart,
    addresses,
    selectedAddress,
    nearestStore,
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

export const createCheckoutOrder = async ({
  userId,
  addressId,
  shippingMethod,
  shippingService,
  shippingCost,
  paymentMethod,
  notes,
}: CreateCheckoutOrderParams) => {
  return prisma.$transaction(async (tx) => {
    const address = await tx.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!address) {
      throw new OrderServiceError(ORDER_ERRORS.ADDRESS_NOT_FOUND, 'Address not found', 404)
    }

    const { latitude, longitude } = getAddressCoordinates(address)
    const nearestStore = await getNearestActiveStore(latitude, longitude, tx)
    const cart = await getCheckoutCart(userId, tx)
    await assertGlobalStockAvailable(cart.items, tx)

    const orderNumber = await generateOrderNumber(userId, tx)
    const totalProductAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.product.basePrice,
      0,
    )
    const isPaymentGateway = paymentMethod === PaymentMethod.PAYMENT_GATEWAY
    const paymentDeadline = isPaymentGateway ? null : new Date(Date.now() + PAYMENT_DEADLINE_IN_MS)
    const paymentGatewayId = null
    const status = OrderStatus.PENDING_PAYMENT

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        storeId: nearestStore.id,
        addressId,
        status,
        totalProductAmount,
        totalAmount: totalProductAmount + shippingCost,
        shippingCost,
        shippingMethod,
        shippingService,
        discountAmount: 0,
        paymentMethod,
        paymentDeadline,
        paymentGatewayId,
        notes: notes || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.product.basePrice,
            subtotal: item.quantity * item.product.basePrice,
          })),
        },
      },
      select: orderSelect,
    })

    await allocateStockForOrder({
      db: tx,
      items: cart.items,
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      nearestStoreId: nearestStore.id,
      latitude,
      longitude,
    })

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return {
      order,
      nearestStore,
      cartCount: 0,
    }
  })
}
