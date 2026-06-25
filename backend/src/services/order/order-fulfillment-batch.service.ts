import prisma from '../../lib/prisma'
import { BatchFulfillmentActionParams, TransactionActionParams } from './order-fulfillment-action.types'

export const runBatchAction = async (
  params: BatchFulfillmentActionParams,
  action: (params: TransactionActionParams) => Promise<unknown>,
) => prisma.$transaction(async (db) => {
  const results = []
  for (const mutationId of params.mutationIds) {
    results.push(await action({ ...params, mutationId, db }))
  }
  return results
})
