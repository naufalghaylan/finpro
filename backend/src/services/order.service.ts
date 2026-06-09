import {
  MutationStatus,
  OrderStatus,
  PaymentMethod,
  Prisma,
  StockJournalType,
  type UserAddress,
} from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { getCart } from './cart.service'

type DatabaseClient = Prisma.TransactionClient

export const ORDER_ERRORS = {
  EMPTY_CART: 'EMPTY_CART',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  ADDRESS_COORDINATE_REQUIRED: 'ADDRESS_COORDINATE_REQUIRED',
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_NUMBER_FAILED: 'ORDER_NUMBER_FAILED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_NOT_CANCELLABLE: 'ORDER_NOT_CANCELLABLE',
  STOCK_NOT_FOUND: 'STOCK_NOT_FOUND',
  STOCK_MUTATION_NOT_FOUND: 'STOCK_MUTATION_NOT_FOUND',
  STOCK_MUTATION_INVALID_STATUS: 'STOCK_MUTATION_INVALID_STATUS',
  FULFILLMENT_ACCESS_DENIED: 'FULFILLMENT_ACCESS_DENIED',
  INVALID_FULFILLMENT_REQUEST: 'INVALID_FULFILLMENT_REQUEST',
} as const

type OrderErrorCode = (typeof ORDER_ERRORS)[keyof typeof ORDER_ERRORS]

export class OrderServiceError extends Error {
  code: OrderErrorCode
  statusCode: number
  details?: unknown

  constructor(code: OrderErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

type CreateCheckoutOrderParams = {
  userId: number
  addressId: number
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

type RequestFulfillmentParams = {
  userId: number
  orderId: number
  sourceStoreId: number
  productId: number
  quantity: number
  notes?: string
}

type FulfillmentActionParams = {
  userId: number
  mutationId: number
  notes?: string
}

type CheckoutCartItem = {
  productId: number
  quantity: number
  product: {
    name: string
    basePrice: number
  }
}

type StockAllocationItem = CheckoutCartItem & {
  product: {
    id: number
    name: string
    basePrice: number
  }
}

type JournalProductSnapshot = {
  id: number
  name: string
  slug: string
  basePrice: number
  categoryId: number
}

type JournalStoreSnapshot = {
  id: number
  name: string
  slug: string
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
}

const PAYMENT_DEADLINE_IN_MS = 60 * 60 * 1000

const buildProductSnapshot = (product: JournalProductSnapshot): Prisma.InputJsonObject => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  basePrice: product.basePrice,
  categoryId: product.categoryId,
})

const buildStoreSnapshot = (store: JournalStoreSnapshot): Prisma.InputJsonObject => ({
  id: store.id,
  name: store.name,
  slug: store.slug,
  address: store.address,
  city: store.city,
  province: store.province,
  latitude: store.latitude,
  longitude: store.longitude,
})

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

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusInKm = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusInKm * c
}

const deg2rad = (deg: number) => deg * (Math.PI / 180)

const getActor = async (userId: number, db: DatabaseClient) => {
  const actor = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      storeId: true,
    },
  })

  if (!actor) {
    throw new OrderServiceError(ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED, 'User not found', 401)
  }

  return actor
}

const assertAdminCanAccessStore = async (
  userId: number,
  storeId: number,
  db: DatabaseClient,
) => {
  const actor = await getActor(userId, db)

  if (actor.role === 'SUPER_ADMIN') return actor

  if (actor.role === 'STORE_ADMIN' && actor.storeId === storeId) return actor

  throw new OrderServiceError(
    ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
    'You do not have access to this store fulfillment',
    403,
  )
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

const getStockTotals = async (productIds: number[], db: DatabaseClient) => {
  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}

const assertGlobalStockAvailable = async (items: CheckoutCartItem[], db: DatabaseClient) => {
  const stockTotals = await getStockTotals(items.map((item) => item.productId), db)
  const insufficientItems = items
    .map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      requestedQuantity: item.quantity,
      availableQuantity: stockTotals.get(item.productId) ?? 0,
    }))
    .filter((item) => item.requestedQuantity > item.availableQuantity)

  if (insufficientItems.length > 0) {
    throw new OrderServiceError(
      ORDER_ERRORS.INSUFFICIENT_STOCK,
      'Some products do not have enough stock',
      400,
      { items: insufficientItems },
    )
  }
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

const createStockJournalEntry = async ({
  db,
  stock,
  orderId,
  stockMutationId,
  quantityChange,
  quantityBefore,
  quantityAfter,
  type,
  userId,
  description,
  notes,
}: {
  db: DatabaseClient
  stock: {
    id: number
    product: JournalProductSnapshot
    store: JournalStoreSnapshot
  }
  orderId?: number
  stockMutationId?: number
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  type: StockJournalType
  userId: number
  description: string
  notes?: string
}) => {
  return db.stockJournal.create({
    data: {
      stockId: stock.id,
      orderId,
      stockMutationId,
      quantityChange,
      quantityBefore,
      quantityAfter,
      type,
      createdBy: userId,
      description,
      productSnapshot: buildProductSnapshot(stock.product),
      storeSnapshot: buildStoreSnapshot(stock.store),
      notes: notes || null,
    },
  })
}

const getStockPriority = (
  stock: { storeId: number; store: { latitude: number; longitude: number } },
  nearestStoreId: number,
  latitude: number,
  longitude: number,
) => {
  if (stock.storeId === nearestStoreId) {
    return -1
  }

  return getDistanceFromLatLonInKm(latitude, longitude, stock.store.latitude, stock.store.longitude)
}

const allocateStockForOrder = async ({
  db,
  items,
  orderId,
  orderNumber,
  userId,
  nearestStoreId,
  latitude,
  longitude,
}: {
  db: DatabaseClient
  items: StockAllocationItem[]
  orderId: number
  orderNumber: string
  userId: number
  nearestStoreId: number
  latitude: number
  longitude: number
}) => {
  for (const item of items) {
    let remainingQuantity = item.quantity
    const availableStocks = await db.stock.findMany({
      where: {
        productId: item.productId,
        quantity: { gt: 0 },
      },
      select: {
        id: true,
        storeId: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            categoryId: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            province: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    const prioritizedStocks = availableStocks.sort((firstStock, secondStock) => {
      const firstPriority = getStockPriority(firstStock, nearestStoreId, latitude, longitude)
      const secondPriority = getStockPriority(secondStock, nearestStoreId, latitude, longitude)

      return firstPriority - secondPriority
    })

    for (const stock of prioritizedStocks) {
      if (remainingQuantity <= 0) break

      const quantityTaken = Math.min(remainingQuantity, stock.quantity)
      const updatedStock = await db.stock.updateMany({
        where: {
          id: stock.id,
          quantity: { gte: quantityTaken },
        },
        data: {
          quantity: { decrement: quantityTaken },
        },
      })

      if (updatedStock.count !== 1) {
        throw new OrderServiceError(
          ORDER_ERRORS.INSUFFICIENT_STOCK,
          'Stock changed while creating order. Please try again.',
          409,
        )
      }

      await createStockJournalEntry({
        db,
        stock,
        orderId,
        quantityChange: -quantityTaken,
        quantityBefore: stock.quantity,
        quantityAfter: stock.quantity - quantityTaken,
        type: StockJournalType.ORDER,
        userId,
        description: `Reserved for order ${orderNumber} - ${item.product.name}`,
        notes: 'Order stock reserve',
      })

      remainingQuantity -= quantityTaken
    }

    if (remainingQuantity > 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Some products do not have enough stock',
        400,
        {
          items: [{
            productId: item.productId,
            productName: item.product.name,
            remainingQuantity,
          }],
        },
      )
    }
  }
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
        description: 'Simulasi pembayaran berhasil dan pesanan langsung masuk proses.',
      },
    ],
  }
}

export const createCheckoutOrder = async ({
  userId,
  addressId,
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
    const paymentGatewayId = isPaymentGateway ? `PG-${orderNumber}` : null
    const status = isPaymentGateway ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        storeId: nearestStore.id,
        addressId,
        status,
        totalProductAmount,
        totalAmount: totalProductAmount,
        shippingCost: 0,
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
        'Order can no longer be cancelled',
        400,
      )
    }

    if (!isAdmin && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Order can only be cancelled before payment is processed',
        400,
      )
    }

    for (const journal of order.stockJournals) {
      const restoreQuantity = Math.abs(journal.quantityChange)
      const stock = await tx.stock.findUnique({
        where: { id: journal.stockId },
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              categoryId: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
              province: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      })

      if (!stock) {
        throw new OrderServiceError(ORDER_ERRORS.STOCK_NOT_FOUND, 'Reserved stock not found', 404)
      }

      const quantityBefore = stock.quantity
      const quantityAfter = quantityBefore + restoreQuantity

      await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: { increment: restoreQuantity },
        },
      })

      await createStockJournalEntry({
        db: tx,
        stock,
        orderId: order.id,
        quantityChange: restoreQuantity,
        quantityBefore,
        quantityAfter,
        type: StockJournalType.CANCEL_RETURN,
        userId,
        description: `Returned reserved stock from cancelled order ${order.orderNumber}`,
        notes: reason || 'Order cancelled, reserved stock restored',
      })
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason || 'Order cancelled',
      },
      select: orderSelect,
    })
  })
}

export const requestOrderFulfillment = async ({
  userId,
  orderId,
  sourceStoreId,
  productId,
  quantity,
  notes,
}: RequestFulfillmentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        orderNumber: true,
        items: {
          where: { productId },
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.CONFIRMED
    ) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Cannot request fulfillment for this order status',
        400,
      )
    }

    if (sourceStoreId === order.storeId) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Source store must be different from destination store',
        400,
      )
    }

    if (order.items.length === 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Product is not part of this order',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    const sourceStock = await tx.stock.findUnique({
      where: {
        productId_storeId: {
          productId,
          storeId: sourceStoreId,
        },
      },
      select: {
        quantity: true,
      },
    })

    if (!sourceStock || sourceStock.quantity < quantity) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Source store does not have enough stock for fulfillment',
        400,
      )
    }

    return tx.stockMutation.create({
      data: {
        orderId: order.id,
        sourceStoreId,
        destinationStoreId: order.storeId,
        productId,
        quantity,
        requestedBy: userId,
        notes: notes || `Fulfillment request for order ${order.orderNumber}`,
      },
      include: {
        order: true,
        sourceStore: true,
        destinationStore: true,
        product: true,
      },
    })
  })
}

export const approveFulfillment = async ({
  userId,
  mutationId,
  notes,
}: FulfillmentActionParams) => {
  return prisma.$transaction(async (tx) => {
    const mutation = await tx.stockMutation.findUnique({
      where: { id: mutationId },
      include: {
        product: true,
        sourceStore: true,
        destinationStore: true,
      },
    })

    if (!mutation) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_NOT_FOUND,
        'Stock mutation not found',
        404,
      )
    }

    if (mutation.status !== MutationStatus.PENDING) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_INVALID_STATUS,
        'Only pending fulfillment requests can be approved',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, mutation.sourceStoreId, tx)

    const sourceStock = await tx.stock.findUnique({
      where: {
        productId_storeId: {
          productId: mutation.productId,
          storeId: mutation.sourceStoreId,
        },
      },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            categoryId: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            province: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    if (!sourceStock || sourceStock.quantity < mutation.quantity) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Source store does not have enough stock',
        400,
      )
    }

    const quantityBefore = sourceStock.quantity
    const quantityAfter = quantityBefore - mutation.quantity
    const updatedStock = await tx.stock.updateMany({
      where: {
        id: sourceStock.id,
        quantity: { gte: mutation.quantity },
      },
      data: {
        quantity: { decrement: mutation.quantity },
      },
    })

    if (updatedStock.count !== 1) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Stock changed while approving fulfillment. Please try again.',
        409,
      )
    }

    await createStockJournalEntry({
      db: tx,
      stock: sourceStock,
      stockMutationId: mutation.id,
      quantityChange: -mutation.quantity,
      quantityBefore,
      quantityAfter,
      type: StockJournalType.MUTATION_OUT,
      userId,
      description: `Fulfillment stock out for mutation #${mutation.id}`,
      notes: notes || mutation.notes || 'Fulfillment approved and stock sent',
    })

    return tx.stockMutation.update({
      where: { id: mutation.id },
      data: {
        status: MutationStatus.IN_TRANSIT,
        approvedBy: userId,
        approvedAt: new Date(),
        sentAt: new Date(),
      },
      include: {
        order: true,
        sourceStore: true,
        destinationStore: true,
        product: true,
      },
    })
  })
}

export const receiveFulfillment = async ({
  userId,
  mutationId,
  notes,
}: FulfillmentActionParams) => {
  return prisma.$transaction(async (tx) => {
    const mutation = await tx.stockMutation.findUnique({
      where: { id: mutationId },
      include: {
        product: true,
        sourceStore: true,
        destinationStore: true,
      },
    })

    if (!mutation) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_NOT_FOUND,
        'Stock mutation not found',
        404,
      )
    }

    if (mutation.status !== MutationStatus.IN_TRANSIT) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_INVALID_STATUS,
        'Only in-transit fulfillment requests can be received',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, mutation.destinationStoreId, tx)

    const destinationStock = await tx.stock.upsert({
      where: {
        productId_storeId: {
          productId: mutation.productId,
          storeId: mutation.destinationStoreId,
        },
      },
      update: {},
      create: {
        productId: mutation.productId,
        storeId: mutation.destinationStoreId,
        quantity: 0,
      },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            categoryId: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            province: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    const quantityBefore = destinationStock.quantity
    const quantityAfter = quantityBefore + mutation.quantity

    await tx.stock.update({
      where: { id: destinationStock.id },
      data: {
        quantity: { increment: mutation.quantity },
      },
    })

    await createStockJournalEntry({
      db: tx,
      stock: destinationStock,
      stockMutationId: mutation.id,
      quantityChange: mutation.quantity,
      quantityBefore,
      quantityAfter,
      type: StockJournalType.MUTATION_IN,
      userId,
      description: `Fulfillment stock received for mutation #${mutation.id}`,
      notes: notes || mutation.notes || 'Fulfillment received by destination store',
    })

    return tx.stockMutation.update({
      where: { id: mutation.id },
      data: {
        status: MutationStatus.COMPLETED,
        receivedBy: userId,
        receivedAt: new Date(),
      },
      include: {
        order: true,
        sourceStore: true,
        destinationStore: true,
        product: true,
      },
    })
  })
}

export const rejectFulfillment = async ({
  userId,
  mutationId,
  notes,
}: FulfillmentActionParams) => {
  return prisma.$transaction(async (tx) => {
    const mutation = await tx.stockMutation.findUnique({
      where: { id: mutationId },
      select: {
        id: true,
        status: true,
        sourceStoreId: true,
        notes: true,
      },
    })

    if (!mutation) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_NOT_FOUND,
        'Stock mutation not found',
        404,
      )
    }

    if (mutation.status !== MutationStatus.PENDING) {
      throw new OrderServiceError(
        ORDER_ERRORS.STOCK_MUTATION_INVALID_STATUS,
        'Only pending fulfillment requests can be rejected',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, mutation.sourceStoreId, tx)

    return tx.stockMutation.update({
      where: { id: mutation.id },
      data: {
        status: MutationStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        notes: notes || mutation.notes || 'Fulfillment request rejected',
      },
      include: {
        order: true,
        sourceStore: true,
        destinationStore: true,
        product: true,
      },
    })
  })
}
