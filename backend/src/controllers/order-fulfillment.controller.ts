import { Request, Response } from 'express'
import {
  approveFulfillment as approveFulfillmentService,
  receiveFulfillment as receiveFulfillmentService,
  rejectFulfillment as rejectFulfillmentService,
  requestOrderFulfillment as requestOrderFulfillmentService,
} from '../services/order.service'
import {
  fulfillmentActionSchema,
  orderParamsSchema,
  requestFulfillmentSchema,
  stockMutationParamsSchema,
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
      message: 'Fulfillment request created',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'requestOrderFulfillment', error)
  }
}

const handleFulfillmentAction = async (
  req: Request,
  res: Response,
  action: 'approve' | 'receive' | 'reject',
) => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const parsedParams = stockMutationParamsSchema.safeParse(req.params)
  const parsedBody = fulfillmentActionSchema.safeParse(req.body)

  if (!parsedParams.success) {
    sendValidationError(res, parsedParams.error)
    return
  }

  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error)
    return
  }

  const payload = {
    userId,
    mutationId: parsedParams.data.mutationId,
    notes: parsedBody.data.notes,
  }

  if (action === 'approve') {
    return approveFulfillmentService(payload)
  }

  if (action === 'receive') {
    return receiveFulfillmentService(payload)
  }

  return rejectFulfillmentService(payload)
}

export const approveFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'approve')
    if (!mutation) return

    res.json({
      message: 'Fulfillment approved and stock sent',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'approveFulfillment', error)
  }
}

export const receiveFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'receive')
    if (!mutation) return

    res.json({
      message: 'Fulfillment received',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'receiveFulfillment', error)
  }
}

export const rejectFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'reject')
    if (!mutation) return

    res.json({
      message: 'Fulfillment rejected',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'rejectFulfillment', error)
  }
}
