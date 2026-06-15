import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  StockJournalType,
  type UserAddress,
} from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { midtransCore, midtransSnap } from '../lib/midtrans'
import { getDistanceFromLatLonInKm } from '../utils/geo.util'
import { assertAdminCanAccessStore } from './order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from './order.errors'
import {
  allocateStockForOrder,
  assertGlobalStockAvailable,
  restoreReservedOrderStock,
} from './order-stock.service'
import { getCart } from './cart.service'

type DatabaseClient = Prisma.TransactionClient

export { ORDER_ERRORS, OrderServiceError } from './order.errors'
export {
  approveFulfillment,
  receiveFulfillment,
  rejectFulfillment,
  requestOrderFulfillment,
} from './order-fulfillment.service'

type CreateCheckoutOrderParams = {
  userId: number
  addressId: number
  shippingMethod: string
  shippingService: string
  shippingCost: number
  paymentMethod: PaymentMethod
  notes?: string
}

type CheckoutPreviewParams = {
  userId: number
  addressId?: number
}

type CancelOrderParams = {
  userId: number
  orderId: number
  reason?: string
  isAdmin?: boolean
}

type OrderPaymentParams = {
  userId: number
  orderId: number
}

type OrderStatusGroup = 'ongoing' | 'completed' | 'cancelled'

type ListOrdersParams = {
  userId: number
  page: number
  limit: number
  startDate?: string
  endDate?: string
  orderNumber?: string
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
}

type ListAdminOrdersParams = Omit<ListOrdersParams, 'userId'> & {
  actorRole: string
  actorStoreId?: number | null
  storeId?: number
}

type UploadPaymentProofParams = OrderPaymentParams & {
  paymentProofUrl: string
}

type ConfirmManualPaymentParams = {
  userId: number
  orderId: number
  action: 'approve' | 'reject'
}

type MidtransNotificationResult = {
  orderId: number
  orderNumber: string
  transactionStatus: string
  orderStatus: OrderStatus
} | null

type MidtransTransactionStatus = {
  order_id: string
  transaction_status: string
  fraud_status?: string
  payment_type?: string
  transaction_id?: string
}

const PAYMENT_DEADLINE_IN_MS = 60 * 60 * 1000

const orderStatusGroups: Record<OrderStatusGroup, OrderStatus[]> = {
  ongoing: [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.WAITING_CONFIRMATION,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
  ],
  completed: [OrderStatus.CONFIRMED],
  cancelled: [OrderStatus.CANCELLED],
}

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalProductAmount: true,
  totalAmount: true,
  shippingCost: true,
  discountAmount: true,
  paymentMethod: true,
  paymentProof: true,
  paymentGatewayId: true,
  paymentDeadline: true,
  shippedAt: true,
  confirmedAt: true,
  cancelledAt: true,
  cancelReason: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  store: {
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
  },
  address: {
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
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      priceAtTime: true,
      subtotal: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            select: {
              id: true,
              imageUrl: true,
              isPrimary: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect

const adminOrderSelect = {
  ...orderSelect,
  shippingMethod: true,
  shippingService: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.OrderSelect

const getStartOfDate = (date: string) => new Date(`${date}T00:00:00.000`)

const getEndOfDate = (date: string) => new Date(`${date}T23:59:59.999`)

const applyOrderListFilters = (
  where: Prisma.OrderWhereInput,
  {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  }: Pick<ListOrdersParams, 'startDate' | 'endDate' | 'orderNumber' | 'status' | 'statusGroup'>,
) => {
  if (orderNumber) {
    where.orderNumber = {
      contains: orderNumber,
      mode: 'insensitive',
    }
  }

  if (status) {
    where.status = status
  } else if (statusGroup) {
    where.status = {
      in: orderStatusGroups[statusGroup],
    }
  }

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {}

    if (startDate) {
      createdAt.gte = getStartOfDate(startDate)
    }

    if (endDate) {
      createdAt.lte = getEndOfDate(endDate)
    }

    where.createdAt = createdAt
  }

  return where
}

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')

const getMidtransFinishUrl = (orderId: number) => `${getFrontendUrl()}/orders/${orderId}`

type MidtransApiError = {
  httpStatusCode?: string | number
  message?: string
  ApiResponse?: {
    status_code?: string | number
    status_message?: string | string[]
    validation_messages?: unknown
  }
}

const getMidtransErrorMessage = (error: unknown) => {
  const apiError = error as MidtransApiError
  const statusMessage = apiError.ApiResponse?.status_message

  if (Array.isArray(statusMessage)) return statusMessage.join(', ')
  if (statusMessage) return statusMessage
  if (apiError.message) return apiError.message

  return null
}

const getMidtransErrorDetails = (error: unknown) => {
  const apiError = error as MidtransApiError

  return {
    httpStatusCode: apiError.httpStatusCode,
    statusCode: apiError.ApiResponse?.status_code,
    statusMessage: apiError.ApiResponse?.status_message,
    validationMessages: apiError.ApiResponse?.validation_messages,
  }
}

const isMidtransTransactionNotFoundError = (error: unknown) => {
  const apiError = error as MidtransApiError
  const httpStatusCode = String(apiError.httpStatusCode ?? '')
  const statusCode = String(apiError.ApiResponse?.status_code ?? '')

  return httpStatusCode === '404' || statusCode === '404'
}

const getMidtransTransactionStatusOrNull = async (orderNumber: string) => {
  try {
    return await midtransCore.transaction.status(orderNumber)
  } catch (error) {
    if (isMidtransTransactionNotFoundError(error)) return null

    throw error
  }
}

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

export const getOrderPaymentDetails = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: orderSelect,
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  return order
}

export const listOrders = async ({
  userId,
  page,
  limit,
  startDate,
  endDate,
  orderNumber,
  status,
  statusGroup,
}: ListOrdersParams) => {
  const skip = (page - 1) * limit
  const where: Prisma.OrderWhereInput = { userId }

  applyOrderListFilters(where, {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  })

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const listAdminOrders = async ({
  actorRole,
  actorStoreId,
  page,
  limit,
  startDate,
  endDate,
  orderNumber,
  status,
  statusGroup,
  storeId,
}: ListAdminOrdersParams) => {
  const skip = (page - 1) * limit
  const where: Prisma.OrderWhereInput = {}

  if (actorRole === 'STORE_ADMIN') {
    if (!actorStoreId) {
      throw new OrderServiceError(
        ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
        'Store admin is not assigned to a store',
        403,
      )
    }

    where.storeId = actorStoreId
  } else if (actorRole === 'SUPER_ADMIN') {
    if (storeId) {
      where.storeId = storeId
    }
  } else {
    throw new OrderServiceError(
      ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
      'You do not have access to admin orders',
      403,
    )
  }

  applyOrderListFilters(where, {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  })

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: adminOrderSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const uploadManualPaymentProof = async ({
  userId,
  orderId,
  paymentProofUrl,
}: UploadPaymentProofParams) => {
  if (!paymentProofUrl) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_PROOF_REQUIRED,
      'Payment proof file is required',
      400,
    )
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentMethod: true,
        paymentDeadline: true,
        paymentProof: true,
      },
    })

    if (!order || order.userId !== userId) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (order.paymentMethod !== PaymentMethod.MANUAL_TRANSFER) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_PROOF_NOT_ALLOWED,
        'Payment proof upload is only available for manual transfer orders',
        400,
      )
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_PROOF_NOT_ALLOWED,
        order.paymentProof
          ? 'Payment proof has already been uploaded'
          : 'Payment proof cannot be uploaded for this order status',
        400,
      )
    }

    if (order.paymentDeadline && new Date() > order.paymentDeadline) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_DEADLINE_EXPIRED,
        'Payment proof upload deadline has expired',
        400,
      )
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentProof: paymentProofUrl,
        status: OrderStatus.WAITING_CONFIRMATION,
      },
      select: orderSelect,
    })
  })
}

export const confirmManualPayment = async ({
  userId,
  orderId,
  action,
}: ConfirmManualPaymentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        paymentMethod: true,
        paymentProof: true,
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    if (order.paymentMethod !== PaymentMethod.MANUAL_TRANSFER) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_CONFIRMATION_NOT_ALLOWED,
        'Manual payment confirmation is only available for manual transfer orders',
        400,
      )
    }

    if (order.status !== OrderStatus.WAITING_CONFIRMATION || !order.paymentProof) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_CONFIRMATION_NOT_ALLOWED,
        'Order is not waiting for manual payment confirmation',
        400,
      )
    }

    return tx.order.update({
      where: { id: order.id },
      data: action === 'approve'
        ? {
          status: OrderStatus.PROCESSING,
          paymentDeadline: null,
        }
        : {
          status: OrderStatus.PENDING_PAYMENT,
          paymentProof: null,
          paymentDeadline: new Date(Date.now() + PAYMENT_DEADLINE_IN_MS),
        },
      select: adminOrderSelect,
    })
  })
}

export const createMidtransSnapToken = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      shippingCost: true,
      discountAmount: true,
      paymentMethod: true,
      paymentGatewayId: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtTime: true,
          subtotal: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  if (order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Midtrans payment is only available for payment gateway orders',
      400,
    )
  }

  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Payment gateway token cannot be created for this order status',
      400,
    )
  }

  if (order.paymentGatewayId) {
    const existingTransactionStatus = await getMidtransTransactionStatusOrNull(order.orderNumber)

    if (!existingTransactionStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentGatewayId: null,
        },
      })
    } else {
      await processMidtransTransactionStatus(existingTransactionStatus)

      if (existingTransactionStatus.transaction_status !== 'pending') {
        throw new OrderServiceError(
          ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
          'Payment gateway transaction is no longer pending. Please refresh order status.',
          409,
        )
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        snapToken: order.paymentGatewayId,
        redirectUrl: null,
      }
    }
  }

  try {
    const midtransReturnUrl = getMidtransFinishUrl(order.id)
    const snapTransaction = await midtransSnap.createTransaction({
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(order.totalAmount),
      },
      customer_details: {
        first_name: order.user.name,
        email: order.user.email,
        phone: order.user.phone || undefined,
      },
      item_details: [
        ...order.items.map((item) => ({
          id: String(item.product.id),
          name: item.product.name.slice(0, 50),
          price: Math.round(item.priceAtTime),
          quantity: item.quantity,
        })),
        {
          id: 'SHIPPING',
          name: 'Shipping Cost',
          price: Math.round(order.shippingCost),
          quantity: 1,
        },
        ...(order.discountAmount > 0 ? [{
          id: 'DISCOUNT',
          name: 'Discount',
          price: -Math.round(order.discountAmount),
          quantity: 1,
        }] : [])
      ],
      callbacks: {
        finish: midtransReturnUrl,
      },
      expiry: {
        unit: 'minute',
        duration: 60,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGatewayId: snapTransaction.token,
      },
    })

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      snapToken: snapTransaction.token,
      redirectUrl: snapTransaction.redirect_url,
    }
  } catch (error) {
    const midtransErrorMessage = getMidtransErrorMessage(error)

    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_TOKEN_FAILED,
      midtransErrorMessage
        ? `Failed to create Midtrans payment token: ${midtransErrorMessage}`
        : 'Failed to create Midtrans payment token',
      502,
      getMidtransErrorDetails(error),
    )
  }
}

const processMidtransTransactionStatus = async (
  notification: MidtransTransactionStatus,
): Promise<MidtransNotificationResult> => {
  const orderNumber = notification.order_id
  const transactionStatus = notification.transaction_status
  const fraudStatus = notification.fraud_status
  const isSuccessfulPayment =
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && (!fraudStatus || fraudStatus === 'accept'))
  const isFailedPayment = ['cancel', 'deny', 'expire', 'failure'].includes(transactionStatus)

  if (!isSuccessfulPayment && !isFailedPayment && transactionStatus !== 'pending') {
    return null
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        stockJournals: {
          where: {
            type: StockJournalType.ORDER,
            quantityChange: { lt: 0 },
          },
          select: {
            stockId: true,
            quantityChange: true,
          },
        },
      },
    })

    if (!order || order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
      return null
    }

    if (isSuccessfulPayment) {
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: order.status,
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
        },
      })

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionStatus,
        orderStatus: OrderStatus.PROCESSING,
      }
    }

    if (isFailedPayment) {
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: order.status,
        }
      }

      const cancelReason = `Midtrans payment ${transactionStatus}`
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason,
        },
      })

      if (updatedOrder.count !== 1) {
        return null
      }

      await restoreReservedOrderStock({
        db: tx,
        order,
        actorUserId: order.userId,
        notes: `${cancelReason}, reserved stock restored`,
      })

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionStatus,
        orderStatus: OrderStatus.CANCELLED,
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      transactionStatus,
      orderStatus: order.status,
    }
  })
}

export const handleMidtransNotification = async (payload: unknown): Promise<MidtransNotificationResult> => {
  const notification = await midtransCore.transaction.notification(payload)

  return processMidtransTransactionStatus(notification)
}

export const syncMidtransPaymentStatus = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      paymentMethod: true,
    },
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  if (order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Midtrans status sync is only available for payment gateway orders',
      400,
    )
  }

  try {
    const transactionStatus = await getMidtransTransactionStatusOrNull(order.orderNumber)

    if (!transactionStatus) {
      return getOrderPaymentDetails({ userId, orderId })
    }

    await processMidtransTransactionStatus(transactionStatus)

    return getOrderPaymentDetails({ userId, orderId })
  } catch (error) {
    const midtransErrorMessage = getMidtransErrorMessage(error)

    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_STATUS_SYNC_FAILED,
      midtransErrorMessage
        ? `Failed to sync Midtrans payment status: ${midtransErrorMessage}`
        : 'Failed to sync Midtrans payment status',
      502,
      getMidtransErrorDetails(error),
    )
  }
}

export const cancelOrder = async ({
  userId,
  orderId,
  reason,
  isAdmin = false,
}: CancelOrderParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        storeId: true,
        status: true,
        orderNumber: true,
        paymentProof: true,
        stockJournals: {
          where: {
            type: StockJournalType.ORDER,
            quantityChange: { lt: 0 },
          },
          select: {
            id: true,
            stockId: true,
            quantityChange: true,
          },
        },
      },
    })

    if (!order || (!isAdmin && order.userId !== userId)) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (isAdmin) {
      await assertAdminCanAccessStore(userId, order.storeId, tx)
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.CONFIRMED
    ) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan sudah tidak bisa dibatalkan',
        400,
      )
    }

    if (!isAdmin && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan hanya bisa dibatalkan sebelum pembayaran diproses',
        400,
      )
    }

    if (!isAdmin && order.paymentProof) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan hanya bisa dibatalkan sebelum bukti bayar diupload',
        400,
      )
    }

    await restoreReservedOrderStock({
      db: tx,
      order,
      actorUserId: userId,
      notes: reason || 'Order cancelled, reserved stock restored',
    })

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason || 'Pesanan dibatalkan oleh pelanggan',
      },
      select: orderSelect,
    })
  })
}

export const autoCancelExpiredManualTransferOrders = async () => {
  const now = new Date()
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.MANUAL_TRANSFER,
      paymentDeadline: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  })

  let cancelledCount = 0

  for (const expiredOrder of expiredOrders) {
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      const claimedOrder = await tx.order.findFirst({
        where: {
          id: expiredOrder.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: PaymentMethod.MANUAL_TRANSFER,
          paymentDeadline: {
            lte: now,
          },
        },
        select: {
          id: true,
          userId: true,
          orderNumber: true,
          stockJournals: {
            where: {
              type: StockJournalType.ORDER,
              quantityChange: { lt: 0 },
            },
            select: {
              stockId: true,
              quantityChange: true,
            },
          },
        },
      })

      if (!claimedOrder) return null

      const cancelReason = 'Auto-cancelled because manual payment proof was not uploaded before deadline'
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: claimedOrder.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: PaymentMethod.MANUAL_TRANSFER,
          paymentDeadline: {
            lte: now,
          },
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
          cancelReason,
        },
      })

      if (updatedOrder.count !== 1) return null

      await restoreReservedOrderStock({
        db: tx,
        order: claimedOrder,
        actorUserId: claimedOrder.userId,
        notes: cancelReason,
      })

      return claimedOrder
    })

    if (cancelledOrder) {
      cancelledCount += 1
    }
  }

  return {
    checkedCount: expiredOrders.length,
    cancelledCount,
  }
}
