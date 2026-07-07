import { MutationStatus } from '../../../generated/prisma/client'
import { getDistanceFromLatLonInKm } from '../../../utils/geo.util'
import { FulfillmentStateOrder } from '../fulfillment/order-fulfillment-state.select'
import { DatabaseClient, FulfillmentRequirement } from '../fulfillment/order-fulfillment-state.types'
import { getReservedQuantities } from './order-fulfillment-reserved.service'
import { statusForRequirement } from './order-fulfillment-status.service'

export const deriveRequirements = async (
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
