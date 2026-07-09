import prisma from '../lib/prisma'
import { checkoutDiscountSelect } from './order/checkout/order-discount.service'
import { getNearestStoreService } from './store.service'

export type GetCartOptions = {
  applyItemDiscounts?: boolean
  lat?: number
  lng?: number
}

export const getActiveProductDiscounts = async (productIds: number[], storeId?: number) => {
  if (productIds.length === 0) {
    return []
  }

  return prisma.discount.findMany({
    where: {
      productId: { in: productIds },
      ...(storeId ? { storeId } : {}),
      isActive: true,
      deletedAt: null,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    select: checkoutDiscountSelect,
  })
}

const resolveUserStoreId = async (userId: number): Promise<number | undefined> => {
  const address = await prisma.userAddress.findFirst({
    where: {
      userId,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
    select: { latitude: true, longitude: true },
  })

  if (address?.latitude == null || address?.longitude == null) {
    return undefined
  }

  const nearest = await getNearestStoreService(address.latitude, address.longitude)
  return nearest?.id
}

export const resolveDiscountStoreId = async (userId: number, options: GetCartOptions): Promise<number | undefined> => {
  if (options.lat !== undefined && options.lng !== undefined) {
    const nearest = await getNearestStoreService(options.lat, options.lng)
    if (nearest) return nearest.id
  }
  return resolveUserStoreId(userId)
}
