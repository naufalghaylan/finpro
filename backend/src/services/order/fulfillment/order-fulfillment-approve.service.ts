import { MutationStatus, StockJournalType } from '../../../generated/prisma/client'
import { assertAdminCanAccessStore } from '../../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../../order-stock-journal.service'
import { getReservedQuantityForSource } from '../fulfillment/order-fulfillment-state.service'
import { assertMutationStatus, fulfillmentMutationInclude } from '../fulfillment/order-fulfillment.utils'
import { TransactionActionParams } from '../fulfillment/order-fulfillment-action.types'

export const approveFulfillmentInTransaction = async ({
  db,
  userId,
  mutationId,
  notes,
  approvedQuantity: requestedApprovedQuantity,
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
    MutationStatus.PENDING,
    'Hanya permintaan mutasi yang menunggu yang dapat disetujui',
  )

  await assertAdminCanAccessStore(userId, mutation.sourceStoreId, db)

  const requestedQuantity = mutation.quantity
  const approvedQuantity = requestedApprovedQuantity ?? requestedQuantity
  if (approvedQuantity < 1 || approvedQuantity > requestedQuantity) {
    throw new OrderServiceError(
      ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
      `Jumlah yang dikirim harus antara 1 dan ${requestedQuantity} item`,
      400,
    )
  }
  const rejectedQuantity = requestedQuantity - approvedQuantity
  const isPartialApproval = rejectedQuantity > 0

  const reservedQuantity = mutation.orderId
    ? await getReservedQuantityForSource({
        orderId: mutation.orderId,
        productId: mutation.productId,
        sourceStoreId: mutation.sourceStoreId,
        db,
      })
    : 0
  const otherSentMutations = mutation.orderId
    ? await db.stockMutation.aggregate({
        where: {
          orderId: mutation.orderId,
          productId: mutation.productId,
          sourceStoreId: mutation.sourceStoreId,
          id: { not: mutation.id },
          status: { in: [MutationStatus.IN_TRANSIT, MutationStatus.COMPLETED] },
        },
        _sum: { quantity: true },
      })
    : null
  const reservedQuantityAvailable = Math.max(
    0,
    reservedQuantity - (otherSentMutations?._sum.quantity ?? 0),
  )
  const quantityToDeduct = Math.max(0, approvedQuantity - reservedQuantityAvailable)
  const quantityToRelease = Math.min(
    rejectedQuantity,
    Math.max(0, reservedQuantityAvailable - approvedQuantity),
  )

  const rejectedMutation = isPartialApproval
    ? await db.stockMutation.create({
        data: {
          orderId: mutation.orderId,
          sourceStoreId: mutation.sourceStoreId,
          destinationStoreId: mutation.destinationStoreId,
          productId: mutation.productId,
          quantity: rejectedQuantity,
          status: MutationStatus.REJECTED,
          requestedBy: mutation.requestedBy,
          rejectedBy: userId,
          rejectedAt: new Date(),
          notes: `Sisa ${rejectedQuantity} dari permintaan awal ${requestedQuantity} item tidak dapat dipenuhi oleh toko sumber`,
        },
      })
    : null

  const shouldLogFulfillmentOut = Boolean(mutation.orderId && approvedQuantity > 0)
  const sourceStock = quantityToDeduct > 0 || quantityToRelease > 0 || shouldLogFulfillmentOut
    ? await db.stock.findUnique({
        where: {
          productId_storeId: {
            productId: mutation.productId,
            storeId: mutation.sourceStoreId,
          },
        },
        select: stockJournalSnapshotSelect,
      })
    : null

  if (quantityToDeduct > 0 && (!sourceStock || sourceStock.quantity < quantityToDeduct)) {
    throw new OrderServiceError(
      ORDER_ERRORS.INSUFFICIENT_STOCK,
      `Stok ${mutation.product.name} di toko sumber tidak mencukupi`,
      400,
    )
  }

  if (quantityToRelease > 0 && !sourceStock) {
    throw new OrderServiceError(
      ORDER_ERRORS.STOCK_NOT_FOUND,
      'Stok toko sumber tidak ditemukan',
      404,
    )
  }

  if (sourceStock && quantityToDeduct > 0) {
    await adjustStockWithJournal({
      db,
      stock: sourceStock,
      orderId: mutation.orderId ?? undefined,
      stockMutationId: mutation.id,
      quantityChange: -quantityToDeduct,
      type: StockJournalType.MUTATION_OUT,
      userId,
      description: `Keluar mutasi #${mutation.id}`,
      notes: notes || mutation.notes || 'Barang dikirim ke toko peminta',
      insufficientStockMessage: 'Stok berubah saat mutasi diproses. Silakan coba kembali.',
    })
  }

  if (sourceStock && quantityToRelease > 0) {
    await adjustStockWithJournal({
      db,
      stock: sourceStock,
      orderId: mutation.orderId ?? undefined,
      stockMutationId: rejectedMutation?.id ?? mutation.id,
      quantityChange: quantityToRelease,
      type: StockJournalType.CANCEL_RETURN,
      userId,
      description: `Pengembalian sisa stok mutasi #${mutation.id}`,
      notes: `Toko sumber hanya menyetujui sebagian (${approvedQuantity} dari ${requestedQuantity} item)`,
    })
  }

  const approvalNotes = isPartialApproval
    ? [
        mutation.notes,
        notes,
        `Disetujui sebagian: ${approvedQuantity} dari ${requestedQuantity} item`,
      ].filter(Boolean).join(' | ')
    : notes || mutation.notes

  return db.stockMutation.update({
    where: { id: mutation.id },
    data: {
      quantity: approvedQuantity,
      status: MutationStatus.IN_TRANSIT,
      approvedBy: userId,
      approvedAt: new Date(),
      sentAt: new Date(),
      notes: approvalNotes,
    },
    include: fulfillmentMutationInclude,
  })
}
