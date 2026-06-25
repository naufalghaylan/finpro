import prisma from '../../lib/prisma'
import { FulfillmentActionParams, BatchFulfillmentActionParams } from './order-fulfillment-action.types'
import { approveFulfillmentInTransaction } from './order-fulfillment-approve.service'
import { receiveFulfillmentInTransaction } from './order-fulfillment-receive.service'
import { rejectFulfillmentInTransaction } from './order-fulfillment-reject.service'
import { runBatchAction } from './order-fulfillment-batch.service'

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
