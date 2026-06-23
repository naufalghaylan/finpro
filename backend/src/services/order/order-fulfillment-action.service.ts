import { MutationStatus, Prisma, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../order-stock-journal.service'
import { getReservedQuantityForSource } from './order-fulfillment-state.service'
import { assertMutationStatus, fulfillmentMutationInclude } from './order-fulfillment.utils'

type FulfillmentActionParams = {
  userId: number
  mutationId: number
  notes?: string
  approvedQuantity?: number
}

type BatchFulfillmentActionParams = {
  userId: number
  mutationIds: number[]
  notes?: string
}

type TransactionActionParams = FulfillmentActionParams & {
  db: Prisma.TransactionClient
}

const approveFulfillmentInTransaction = async ({
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
      description: `Stok tambahan keluar untuk mutasi #${mutation.id}`,
      notes: notes || mutation.notes || 'Mutasi disetujui dan barang dikirim',
      insufficientStockMessage: 'Stok berubah saat mutasi diproses. Silakan coba kembali.',
    })
  } else if (sourceStock && shouldLogFulfillmentOut) {
    await adjustStockWithJournal({
      db,
      stock: sourceStock,
      orderId: mutation.orderId ?? undefined,
      stockMutationId: mutation.id,
      quantityChange: 0,
      type: StockJournalType.MUTATION_OUT,
      userId,
      description: `Barang fulfillment keluar untuk mutasi #${mutation.id}`,
      notes: notes || mutation.notes || 'Barang keluar fisik untuk fulfillment pesanan; stok jual sudah dialokasikan saat checkout',
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
      description: `Sisa cadangan dilepas dari persetujuan parsial mutasi #${mutation.id}`,
      notes: `Toko sumber hanya mengirim ${approvedQuantity} dari ${requestedQuantity} item`,
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

const receiveFulfillmentInTransaction = async ({
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

  await adjustStockWithJournal({
    db,
    stock: destinationStock,
    orderId: mutation.orderId ?? undefined,
    stockMutationId: mutation.id,
    quantityChange: mutation.orderId ? 0 : mutation.quantity,
    type: StockJournalType.MUTATION_IN,
    userId,
    description: mutation.orderId
      ? `Barang fulfillment diterima untuk mutasi #${mutation.id}`
      : `Stok diterima untuk mutasi #${mutation.id}`,
    notes: notes || mutation.notes || (mutation.orderId
      ? 'Barang masuk fisik untuk fulfillment pesanan; stok jual tetap karena barang dialokasikan ke pesanan'
      : 'Barang mutasi diterima toko tujuan'),
  })

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

const rejectFulfillmentInTransaction = async ({
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
        description: `Cadangan stok dilepas karena mutasi #${mutation.id} ditolak`,
        notes: notes || 'Permintaan mutasi stok ditolak',
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

const runBatchAction = async (
  params: BatchFulfillmentActionParams,
  action: (params: TransactionActionParams) => Promise<unknown>,
) => prisma.$transaction(async (db) => {
  const results = []
  for (const mutationId of params.mutationIds) {
    results.push(await action({ ...params, mutationId, db }))
  }
  return results
})

export const approveFulfillment = (params: FulfillmentActionParams) => (
  prisma.$transaction((db) => approveFulfillmentInTransaction({ ...params, db }))
)

export const receiveFulfillment = (params: FulfillmentActionParams) => (
  prisma.$transaction((db) => receiveFulfillmentInTransaction({ ...params, db }))
)

export const rejectFulfillment = (params: FulfillmentActionParams) => (
  prisma.$transaction((db) => rejectFulfillmentInTransaction({ ...params, db }))
)

export const approveFulfillments = (params: BatchFulfillmentActionParams) => (
  runBatchAction(params, approveFulfillmentInTransaction)
)

export const receiveFulfillments = (params: BatchFulfillmentActionParams) => (
  runBatchAction(params, receiveFulfillmentInTransaction)
)

export const rejectFulfillments = (params: BatchFulfillmentActionParams) => (
  runBatchAction(params, rejectFulfillmentInTransaction)
)
