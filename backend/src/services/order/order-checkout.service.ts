import { OrderStatus, PaymentMethod, type UserAddress } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { getDistanceFromLatLonInKm } from '../../utils/geo.util'
import { getCart } from '../cart.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { allocateStockForOrder, assertGlobalStockAvailable } from '../order-stock.service'
import { PAYMENT_DEADLINE_IN_MS } from './order.constants'
import { orderSelect } from './order.select'
import type { CheckoutPreviewParams, CreateCheckoutOrderParams, DatabaseClient } from './order.types'

const getNearestActiveStore = async (latitude: number, longitude: number, db: DatabaseClient = prisma) => {
  const stores = await db.store.findMany({
    where: { status: true },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      province: true,
      latitude: true,
      longitude: true,
      serviceRadius: true,
    },
  })

  if (stores.length === 0) {
    throw new OrderServiceError(ORDER_ERRORS.STORE_NOT_FOUND, 'No active store available', 404)
  }

  const storesWithDistance = stores.map((store) => {
    const distance = getDistanceFromLatLonInKm(latitude, longitude, store.latitude, store.longitude)

    return {
      ...store,
      distance: Number(distance.toFixed(2)),
      isOutOfRange: distance > store.serviceRadius,
    }
  })

  return storesWithDistance.sort((firstStore, secondStore) => firstStore.distance - secondStore.distance)[0]
}

const getUserAddresses = async (userId: number) => {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      recipientName: true,
      phone: true,
      address: true,
      city: true,
      province: true,
      district: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

const getAddressCoordinates = (address: Pick<UserAddress, 'latitude' | 'longitude'>) => {
  if (address.latitude === null || address.longitude === null) {
    throw new OrderServiceError(
      ORDER_ERRORS.ADDRESS_COORDINATE_REQUIRED,
      'Selected address must have latitude and longitude',
      400,
    )
  }

  return {
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

const getCheckoutCart = async (userId: number, db: DatabaseClient) => {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    throw new OrderServiceError(ORDER_ERRORS.EMPTY_CART, 'Cart is empty', 400)
  }

  return cart
}

const getOrderNumberDatePart = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

const generateOrderNumber = async (userId: number, db: DatabaseClient) => {
  const datePart = getOrderNumberDatePart(new Date())

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const orderNumber = `ORD-${datePart}-${userId}-${suffix}`
    const existingOrder = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    })

    if (!existingOrder) {
      return orderNumber
    }
  }

  throw new OrderServiceError(
    ORDER_ERRORS.ORDER_NUMBER_FAILED,
    'Failed to generate unique order number',
    500,
  )
}

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
