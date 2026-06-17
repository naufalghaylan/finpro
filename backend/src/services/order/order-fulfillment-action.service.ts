import { MutationStatus, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../order-stock-journal.service'
import { assertMutationStatus, fulfillmentMutationInclude } from './order-fulfillment.utils'

type FulfillmentActionParams = {
  userId: number
  mutationId: number
  notes?: string
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

    assertMutationStatus(
      mutation.status,
      MutationStatus.PENDING,
      'Only pending fulfillment requests can be approved',
    )

    await assertAdminCanAccessStore(userId, mutation.sourceStoreId, tx)

    const sourceStock = await tx.stock.findUnique({
      where: {
        productId_storeId: {
          productId: mutation.productId,
          storeId: mutation.sourceStoreId,
        },
      },
      select: stockJournalSnapshotSelect,
    })

    if (!sourceStock || sourceStock.quantity < mutation.quantity) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Source store does not have enough stock',
        400,
      )
    }

    await adjustStockWithJournal({
      db: tx,
      stock: sourceStock,
      stockMutationId: mutation.id,
      quantityChange: -mutation.quantity,
      type: StockJournalType.MUTATION_OUT,
      userId,
      description: `Fulfillment stock out for mutation #${mutation.id}`,
      notes: notes || mutation.notes || 'Fulfillment approved and stock sent',
      insufficientStockMessage: 'Stock changed while approving fulfillment. Please try again.',
    })

    return tx.stockMutation.update({
      where: { id: mutation.id },
      data: {
        status: MutationStatus.IN_TRANSIT,
        approvedBy: userId,
        approvedAt: new Date(),
        sentAt: new Date(),
      },
      include: fulfillmentMutationInclude,
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

    assertMutationStatus(
      mutation.status,
      MutationStatus.IN_TRANSIT,
      'Only in-transit fulfillment requests can be received',
    )

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
      select: stockJournalSnapshotSelect,
    })

    await adjustStockWithJournal({
      db: tx,
      stock: destinationStock,
      stockMutationId: mutation.id,
      quantityChange: mutation.quantity,
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
      include: fulfillmentMutationInclude,
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

    assertMutationStatus(
      mutation.status,
      MutationStatus.PENDING,
      'Only pending fulfillment requests can be rejected',
    )

    await assertAdminCanAccessStore(userId, mutation.sourceStoreId, tx)

    return tx.stockMutation.update({
      where: { id: mutation.id },
      data: {
        status: MutationStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        notes: notes || mutation.notes || 'Fulfillment request rejected',
      },
      include: fulfillmentMutationInclude,
    })
  })
}
