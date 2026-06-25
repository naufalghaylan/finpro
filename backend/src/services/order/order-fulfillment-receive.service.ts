import { MutationStatus, StockJournalType } from '../../generated/prisma/client'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../order-stock-journal.service'
import { assertMutationStatus, fulfillmentMutationInclude } from './order-fulfillment.utils'
import { TransactionActionParams } from './order-fulfillment-action.types'

export const receiveFulfillmentInTransaction = async ({
  db,
  userId,
  mutationId,
  notes,
}: TransactionActionParams) => {
  const mutation = await db.stockMutation.findUnique({
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
      'Mutasi stok tidak ditemukan',
      404,
    )
  }

  assertMutationStatus(
    mutation.status,
    MutationStatus.IN_TRANSIT,
    'Hanya barang mutasi dalam perjalanan yang dapat diterima',
  )

  await assertAdminCanAccessStore(userId, mutation.destinationStoreId, db)

  const destinationStock = await db.stock.upsert({
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
    select: stockJournalSnapshotSelect,
  })

  const quantityChange = mutation.orderId ? 0 : mutation.quantity;
  if (quantityChange > 0) {
    await adjustStockWithJournal({
      db,
      stock: destinationStock,
      orderId: mutation.orderId ?? undefined,
      stockMutationId: mutation.id,
      quantityChange,
      type: StockJournalType.MUTATION_IN,
      userId,
      description: `Masuk mutasi #${mutation.id}`,
      notes: notes || mutation.notes || 'Barang diterima dari toko pengirim',
    })
  }

  return db.stockMutation.update({
    where: { id: mutation.id },
    data: {
      status: MutationStatus.COMPLETED,
      receivedBy: userId,
      receivedAt: new Date(),
    },
    include: fulfillmentMutationInclude,
  })
}
