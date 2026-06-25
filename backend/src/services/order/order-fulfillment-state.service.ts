import { MutationStatus, OrderStatus, Prisma, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { getDistanceFromLatLonInKm } from '../../utils/geo.util'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'

type DatabaseClient = Prisma.TransactionClient

export type StockFulfillmentStatus =
  | 'NOT_REQUIRED'
  | 'REQUIRED'
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'REJECTED'

export type FulfillmentSourceRecommendation = {
  storeId: number
  storeName: string
  city: string
  distanceKm: number
  availableQuantity: number
  reservedQuantity: number
}

export type FulfillmentRequirement = {
  productId: number
  productName: string
  requiredQuantity: number
  completedQuantity: number
  activeQuantity: number
  remainingQuantity: number
  status: StockFulfillmentStatus
  sources: FulfillmentSourceRecommendation[]
}

export type OrderStockFulfillment = {
  status: StockFulfillmentStatus
  required: boolean
  canShip: boolean
  requirements: FulfillmentRequirement[]
}

const fulfillmentStateSelect = {
  id: true,
  status: true,
  storeId: true,
  store: {
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  },
  items: {
    select: {
      productId: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  stockJournals: {
    where: {
      type: {
        in: [
          StockJournalType.ORDER,
          StockJournalType.CANCEL_RETURN,
          StockJournalType.MUTATION_OUT,
        ],
      },
    },
    select: {
      stockId: true,
      quantityChange: true,
      type: true,
      stock: {
        select: {
          productId: true,
          storeId: true,
        },
      },
    },
  },
  stockMutations: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      productId: true,
      sourceStoreId: true,
      quantity: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect

type FulfillmentStateOrder = Prisma.OrderGetPayload<{
  select: typeof fulfillmentStateSelect
}>

const statusForRequirement = ({
  requiredQuantity,
  completedQuantity,
  pendingQuantity,
  inTransitQuantity,
  hasRejectedMutation,
}: {
  requiredQuantity: number
  completedQuantity: number
  pendingQuantity: number
  inTransitQuantity: number
  hasRejectedMutation: boolean
}): StockFulfillmentStatus => {
  if (completedQuantity >= requiredQuantity) return 'COMPLETED'

  const uncoveredQuantity = requiredQuantity - completedQuantity - pendingQuantity - inTransitQuantity
  if (uncoveredQuantity > 0) return hasRejectedMutation ? 'REJECTED' : 'REQUIRED'
  if (pendingQuantity > 0) return 'PENDING'
  if (inTransitQuantity > 0) return 'IN_TRANSIT'

  return 'REQUIRED'
}

const overallStatus = (requirements: FulfillmentRequirement[]): StockFulfillmentStatus => {
  if (requirements.length === 0) return 'NOT_REQUIRED'
  if (requirements.every((requirement) => requirement.status === 'COMPLETED')) return 'COMPLETED'
  if (requirements.some((requirement) => requirement.status === 'REJECTED')) return 'REJECTED'
  if (requirements.some((requirement) => requirement.status === 'REQUIRED')) return 'REQUIRED'
  if (requirements.some((requirement) => requirement.status === 'PENDING')) return 'PENDING'
  if (requirements.some((requirement) => requirement.status === 'IN_TRANSIT')) return 'IN_TRANSIT'

  return 'REQUIRED'
}

const getReservedQuantities = (order: FulfillmentStateOrder) => {
  const reservedByProductAndStore = new Map<string, number>()

  for (const journal of order.stockJournals) {
    if (journal.type === StockJournalType.MUTATION_OUT) continue

    const key = `${journal.stock.productId}:${journal.stock.storeId}`
    const currentQuantity = reservedByProductAndStore.get(key) ?? 0
    reservedByProductAndStore.set(key, currentQuantity - journal.quantityChange)
  }

  return reservedByProductAndStore
}

const deriveRequirements = async (
  order: FulfillmentStateOrder,
  db: DatabaseClient,
): Promise<FulfillmentRequirement[]> => {
  const reservedQuantities = getReservedQuantities(order)
  const productIds = order.items.map((item) => item.productId)
  const candidateStocks = productIds.length === 0
    ? []
    : await db.stock.findMany({
        where: {
          productId: { in: productIds },
          storeId: { not: order.storeId },
          store: { status: true },
        },
        select: {
          productId: true,
          storeId: true,
          quantity: true,
          store: {
            select: {
              id: true,
              name: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      })

  const requirements: FulfillmentRequirement[] = []

  for (const item of order.items) {
    const destinationReserved = Math.max(
      0,
      reservedQuantities.get(`${item.productId}:${order.storeId}`) ?? 0,
    )
    const mutations = order.stockMutations.filter((mutation) => mutation.productId === item.productId)
    const rejectedSourceStoreIds = new Set(
      mutations
        .filter((mutation) => mutation.status === MutationStatus.REJECTED)
        .map((mutation) => mutation.sourceStoreId),
    )
    const legacyRequiredQuantity = mutations.length > 0
      ? Math.max(...mutations.map((mutation) => mutation.quantity))
      : 0
    const requiredQuantity = Math.max(
      Math.max(0, item.quantity - destinationReserved),
      legacyRequiredQuantity,
    )

    if (requiredQuantity <= 0) continue

    const completedQuantity = mutations
      .filter((mutation) => mutation.status === MutationStatus.COMPLETED)
      .reduce((total, mutation) => total + mutation.quantity, 0)
    const pendingQuantity = mutations
      .filter((mutation) => mutation.status === MutationStatus.PENDING)
      .reduce((total, mutation) => total + mutation.quantity, 0)
    const inTransitQuantity = mutations
      .filter((mutation) => mutation.status === MutationStatus.IN_TRANSIT)
      .reduce((total, mutation) => total + mutation.quantity, 0)
    const activeQuantity = pendingQuantity + inTransitQuantity
    const remainingQuantity = Math.max(0, requiredQuantity - completedQuantity - activeQuantity)
    const latestMutation = mutations[0]
    const requirementStatus = statusForRequirement({
      requiredQuantity,
      completedQuantity,
      pendingQuantity,
      inTransitQuantity,
      hasRejectedMutation: latestMutation?.status === MutationStatus.REJECTED,
    })
    const sources = candidateStocks
      .filter((stock) => (
        stock.productId === item.productId &&
        !rejectedSourceStoreIds.has(stock.storeId)
      ))
      .map((stock) => {
        const reservedQuantity = Math.max(
          0,
          reservedQuantities.get(`${item.productId}:${stock.storeId}`) ?? 0,
        )
        const sentQuantity = mutations
          .filter((mutation) => (
            mutation.sourceStoreId === stock.storeId &&
            (mutation.status === MutationStatus.IN_TRANSIT ||
              mutation.status === MutationStatus.COMPLETED)
          ))
          .reduce((total, mutation) => total + mutation.quantity, 0)
        const availableReservedQuantity = Math.max(0, reservedQuantity - sentQuantity)

        return {
          storeId: stock.storeId,
          storeName: stock.store.name,
          city: stock.store.city,
          distanceKm: Number(getDistanceFromLatLonInKm(
            order.store.latitude,
            order.store.longitude,
            stock.store.latitude,
            stock.store.longitude,
          ).toFixed(2)),
          availableQuantity: stock.quantity + availableReservedQuantity,
          reservedQuantity: availableReservedQuantity,
        }
      })
      .filter((source) => source.availableQuantity > 0)
      .sort((firstSource, secondSource) => (
        firstSource.distanceKm - secondSource.distanceKm ||
        secondSource.availableQuantity - firstSource.availableQuantity
      ))

    requirements.push({
      productId: item.productId,
      productName: item.product.name,
      requiredQuantity,
      completedQuantity,
      activeQuantity,
      remainingQuantity,
      status: requirementStatus,
      sources,
    })
  }

  return requirements
}

export const getOrderStockFulfillment = async (
  orderId: number,
  db: DatabaseClient = prisma,
): Promise<OrderStockFulfillment> => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: fulfillmentStateSelect,
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Pesanan tidak ditemukan', 404)
  }

  if (order.status === OrderStatus.CANCELLED) {
    return {
      status: 'NOT_REQUIRED',
      required: false,
      canShip: false,
      requirements: [],
    }
  }

  const requirements = await deriveRequirements(order, db)
  const status = overallStatus(requirements)

  return {
    status,
    required: requirements.length > 0,
    canShip: status === 'NOT_REQUIRED' || status === 'COMPLETED',
    requirements,
  }
}

export const getOrdersStockFulfillment = async (
  orderIds: number[],
): Promise<Map<number, OrderStockFulfillment>> => {
  const entries = await Promise.all(orderIds.map(async (orderId) => (
    [orderId, await getOrderStockFulfillment(orderId)] as const
  )))

  return new Map(entries)
}

export const getReservedQuantityForSource = async ({
  orderId,
  productId,
  sourceStoreId,
  db,
}: {
  orderId: number
  productId: number
  sourceStoreId: number
  db: DatabaseClient
}) => {
  const journals = await db.stockJournal.findMany({
    where: {
      orderId,
      stock: {
        productId,
        storeId: sourceStoreId,
      },
      type: {
        in: [StockJournalType.ORDER, StockJournalType.CANCEL_RETURN],
      },
    },
    select: {
      quantityChange: true,
    },
  })

  return Math.max(0, -journals.reduce((total, journal) => total + journal.quantityChange, 0))
}
