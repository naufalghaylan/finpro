import { OrderStatus, PaymentMethod } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { allocateStockForOrder, assertGlobalStockAvailable, assertProductsAvailableInStore } from '../../order-stock.service'
import { PAYMENT_DEADLINE_IN_MS } from '../core/order.constants'
import { orderSelect } from '../core/order.select'
import {
  generateOrderNumber,
  getAddressCoordinates,
  getCheckoutCart,
  getNearestActiveStore,
} from '../checkout/order-checkout-validation.service'
import { resolveCheckoutDiscount } from '../checkout/order-discount.service'
import { calculateVoucherDiscount, getCheckoutVoucher } from '../checkout/order-checkout-voucher.service'
import type { CreateCheckoutOrderParams } from '../core/order.types'
import { notifyOrderStatusChange } from '../order-notification.service'

export const createCheckoutOrder = async ({
  userId,
  addressId,
  shippingMethod,
  shippingService,
  shippingCost,
  paymentMethod,
  voucherId,
  notes,
  discountId,
}: CreateCheckoutOrderParams) => {
  const result = await prisma.$transaction(async (tx) => {
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
    await assertProductsAvailableInStore(cart.items, nearestStore.id, tx)
    await assertGlobalStockAvailable(cart.items, tx)

    const orderNumber = await generateOrderNumber(userId, tx)
    const totalProductAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.product.basePrice,
      0,
    )
    // Diskon produk (per-produk) selalu otomatis; diskon toko hanya yang dipilih user (maks 1).
    const { totalDiscount: storeDiscount } = await resolveCheckoutDiscount(
      nearestStore.id,
      cart.items,
      totalProductAmount,
      discountId,
      tx,
    )

    // Diskon voucher user (fitur Voucher)
    const selectedVoucher = voucherId ? await getCheckoutVoucher(userId, voucherId, tx) : null
    const voucherDiscount = selectedVoucher
      ? calculateVoucherDiscount({
        voucher: selectedVoucher,
        cartItems: cart.items,
        totalProductAmount,
        shippingCost,
      })
      : 0

    if (selectedVoucher && voucherDiscount <= 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.VOUCHER_NOT_AVAILABLE,
        'Voucher tidak dapat digunakan untuk pesanan ini',
        400,
      )
    }

    // Stack kedua diskon, batasi agar tidak melebihi (subtotal produk + ongkir)
    const discountAmount = Math.min(
      storeDiscount + voucherDiscount,
      totalProductAmount + shippingCost,
    )

    const isPaymentGateway = paymentMethod === PaymentMethod.PAYMENT_GATEWAY
    const paymentDeadline = isPaymentGateway ? null : new Date(Date.now() + PAYMENT_DEADLINE_IN_MS)
    const paymentGatewayId = null
    const status = OrderStatus.PENDING_PAYMENT
    const totalAmount = Math.max(0, totalProductAmount - discountAmount + shippingCost)

    if (selectedVoucher) {
      const updatedVoucher = await tx.voucher.updateMany({
        where: {
          id: selectedVoucher.id,
          userId,
          used: false,
          expiredAt: { gt: new Date() },
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      })

      if (updatedVoucher.count !== 1) {
        throw new OrderServiceError(
          ORDER_ERRORS.VOUCHER_NOT_AVAILABLE,
          'Voucher tidak tersedia atau sudah digunakan',
          400,
        )
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        storeId: nearestStore.id,
        addressId,
        status,
        totalProductAmount,
        totalAmount,
        shippingCost,
        shippingMethod,
        shippingService,
        discountAmount,
        voucherId: selectedVoucher?.id ?? null,
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

  await notifyOrderStatusChange(result.order.id, 'CHECKOUT_CREATED')

  return result
}
