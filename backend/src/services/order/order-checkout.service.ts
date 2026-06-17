import {
  DiscountType,
  OrderStatus,
  PaymentMethod,
  VoucherApplicableTo,
} from '../../generated/prisma/client'
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
import type {
  CheckoutPreviewParams,
  CreateCheckoutOrderParams,
  DatabaseClient,
} from './order.types'

type CheckoutDb = DatabaseClient | typeof prisma

type CheckoutVoucher = {
  id: number
  code: string
  name: string
  productId: number | null
  source: string
  discountType: DiscountType
  discountValue: number
  maxDiscount: number | null
  minPurchase: number
  applicableTo: VoucherApplicableTo
  expiredAt: Date
}

type CheckoutCartItem = {
  productId: number
  quantity: number
  product: {
    basePrice: number
  }
}

const voucherSelect = {
  id: true,
  code: true,
  name: true,
  productId: true,
  source: true,
  discountType: true,
  discountValue: true,
  maxDiscount: true,
  minPurchase: true,
  applicableTo: true,
  expiredAt: true,
} as const

const getAvailableCheckoutVouchers = (userId: number, db: CheckoutDb = prisma) =>
  db.voucher.findMany({
    where: {
      userId,
      used: false,
      expiredAt: { gt: new Date() },
    },
    select: voucherSelect,
    orderBy: { expiredAt: 'asc' },
  })

const getDiscountableAmount = (
  voucher: CheckoutVoucher,
  cartItems: CheckoutCartItem[],
  totalProductAmount: number,
  shippingCost: number,
) => {
  if (voucher.applicableTo === VoucherApplicableTo.SHIPPING) {
    return shippingCost
  }

  if (voucher.applicableTo === VoucherApplicableTo.SPECIFIC_PRODUCT) {
    return cartItems.reduce((total, item) => (
      item.productId === voucher.productId
        ? total + item.quantity * item.product.basePrice
        : total
    ), 0)
  }

  return totalProductAmount
}

const calculateVoucherDiscount = ({
  voucher,
  cartItems,
  totalProductAmount,
  shippingCost,
}: {
  voucher: CheckoutVoucher
  cartItems: CheckoutCartItem[]
  totalProductAmount: number
  shippingCost: number
}) => {
  if (totalProductAmount < voucher.minPurchase) return 0

  const discountableAmount = getDiscountableAmount(
    voucher,
    cartItems,
    totalProductAmount,
    shippingCost,
  )
  if (discountableAmount <= 0) return 0

  const rawDiscount = voucher.discountType === DiscountType.PERCENTAGE
    ? discountableAmount * (voucher.discountValue / 100)
    : voucher.discountType === DiscountType.NOMINAL
      ? voucher.discountValue
      : 0

  const cappedDiscount = voucher.maxDiscount
    ? Math.min(rawDiscount, voucher.maxDiscount)
    : rawDiscount

  return Math.min(discountableAmount, Math.max(0, cappedDiscount))
}

const getCheckoutVoucher = async (userId: number, voucherId: number, db: CheckoutDb) => {
  const voucher = await db.voucher.findFirst({
    where: {
      id: voucherId,
      userId,
      used: false,
      expiredAt: { gt: new Date() },
    },
    select: voucherSelect,
  })

  if (!voucher) {
    throw new OrderServiceError(
      ORDER_ERRORS.VOUCHER_NOT_AVAILABLE,
      'Voucher tidak tersedia atau sudah tidak berlaku',
      400,
    )
  }

  return voucher
}

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

  return {
    cart,
    addresses,
    vouchers,
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
  voucherId,
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
    const selectedVoucher = voucherId ? await getCheckoutVoucher(userId, voucherId, tx) : null
    const discountAmount = selectedVoucher
      ? calculateVoucherDiscount({
        voucher: selectedVoucher,
        cartItems: cart.items,
        totalProductAmount,
        shippingCost,
      })
      : 0

    if (selectedVoucher && discountAmount <= 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.VOUCHER_NOT_AVAILABLE,
        'Voucher tidak dapat digunakan untuk pesanan ini',
        400,
      )
    }

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
