import { Request, Response } from 'express'
import {
  requestOrderFulfillment as requestOrderFulfillmentService,
  requestOrderFulfillments as requestOrderFulfillmentsService,
} from '../services/order.service'
import {
  orderParamsSchema,
  requestFulfillmentBatchSchema,
  requestFulfillmentSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

export const requestOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = requestFulfillmentSchema.safeParse(req.body)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!parsedBody.success) {
      sendValidationError(res, parsedBody.error)
      return
    }

    const mutation = await requestOrderFulfillmentService({
      userId,
      orderId: parsedParams.data.id,
      sourceStoreId: parsedBody.data.sourceStoreId,
      productId: parsedBody.data.productId,
      quantity: parsedBody.data.quantity,
      notes: parsedBody.data.notes,
    })

    res.status(201).json({
      message: 'Permintaan mutasi stok berhasil dibuat',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'requestOrderFulfillment', error)
  }
}

export const requestOrderFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = requestFulfillmentBatchSchema.safeParse(req.body)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!parsedBody.success) {
      sendValidationError(res, parsedBody.error)
      return
    }

    const mutations = await requestOrderFulfillmentsService({
      userId,
      orderId: parsedParams.data.id,
      requests: parsedBody.data.requests,
    })

    res.status(201).json({
      message: `${mutations.length} permintaan mutasi stok berhasil dibuat`,
      data: mutations,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'requestOrderFulfillments', error)
  }
}
