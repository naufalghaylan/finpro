import { MutationStatus, StockJournalType } from '../../generated/prisma/client'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../order-stock-journal.service'
import { getReservedQuantityForSource } from './order-fulfillment-state.service'
import { assertMutationStatus, fulfillmentMutationInclude } from './order-fulfillment.utils'
import { TransactionActionParams } from './order-fulfillment-action.types'

export const rejectFulfillmentInTransaction = async ({
  db,
  userId,
  mutationId,
  notes,
}: TransactionActionParams) => {
  const mutation = await db.stockMutation.findUnique({
    where: { id: mutationId },
    select: {
      id: true,
      orderId: true,
      status: true,
      sourceStoreId: true,
      productId: true,
      quantity: true,
      notes: true,
    },
  })

  if (!mutation) {
    throw new OrderServiceError(
      ORDER_ERRORS.STOCK_MUTATION_NOT_FOUND,
      'Mutasi stok tidak ditemukan',
      404,
    )
  }

  assertMutationStatus(
    mutation.status,
    MutationStatus.PENDING,
    'Hanya permintaan mutasi yang menunggu yang dapat ditolak',
  )

  await assertAdminCanAccessStore(userId, mutation.sourceStoreId, db)

  if (mutation.orderId) {
    const reservedQuantity = await getReservedQuantityForSource({
      orderId: mutation.orderId,
      productId: mutation.productId,
      sourceStoreId: mutation.sourceStoreId,
      db,
    })
    const sentMutations = await db.stockMutation.aggregate({
      where: {
        orderId: mutation.orderId,
        productId: mutation.productId,
        sourceStoreId: mutation.sourceStoreId,
        id: { not: mutation.id },
        status: { in: [MutationStatus.IN_TRANSIT, MutationStatus.COMPLETED] },
      },
      _sum: { quantity: true },
    })
    const releasableQuantity = Math.min(
      mutation.quantity,
      Math.max(0, reservedQuantity - (sentMutations._sum.quantity ?? 0)),
    )

    if (releasableQuantity > 0) {
      const sourceStock = await db.stock.findUnique({
        where: {
          productId_storeId: {
            productId: mutation.productId,
            storeId: mutation.sourceStoreId,
          },
        },
        select: stockJournalSnapshotSelect,
      })

      if (!sourceStock) {
        throw new OrderServiceError(
          ORDER_ERRORS.STOCK_NOT_FOUND,
          'Stok toko sumber tidak ditemukan',
          404,
        )
      }

      await adjustStockWithJournal({
        db,
        stock: sourceStock,
        orderId: mutation.orderId,
        stockMutationId: mutation.id,
        quantityChange: releasableQuantity,
        type: StockJournalType.CANCEL_RETURN,
        userId,
        description: `Pengembalian stok mutasi #${mutation.id} ditolak`,
        notes: notes || 'Permintaan mutasi ditolak toko pengirim',
      })
    }
  }

  return db.stockMutation.update({
    where: { id: mutation.id },
    data: {
      status: MutationStatus.REJECTED,
      rejectedBy: userId,
      rejectedAt: new Date(),
      notes: notes || mutation.notes || 'Permintaan mutasi stok ditolak',
    },
    include: fulfillmentMutationInclude,
  })
}
