import { Prisma } from '../generated/prisma/client'
import { ORDER_ERRORS, OrderServiceError } from './order.errors'

type DatabaseClient = Prisma.TransactionClient

export const getActor = async (userId: number, db: DatabaseClient) => {
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

export const assertAdminCanAccessStore = async (
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
