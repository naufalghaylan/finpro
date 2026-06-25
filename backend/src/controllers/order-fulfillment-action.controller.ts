import { Request, Response } from 'express'
import {
  approveFulfillment as approveFulfillmentService,
  receiveFulfillment as receiveFulfillmentService,
  rejectFulfillment as rejectFulfillmentService,
} from '../services/order.service'
import {
  approveFulfillmentSchema,
  fulfillmentActionSchema,
  receiveFulfillmentSchema,
  stockMutationParamsSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

const handleFulfillmentAction = async (
  req: Request,
  res: Response,
  action: 'approve' | 'receive' | 'reject',
) => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const parsedParams = stockMutationParamsSchema.safeParse(req.params)
  const actionSchema = action === 'approve'
    ? approveFulfillmentSchema
    : action === 'receive'
      ? receiveFulfillmentSchema
      : fulfillmentActionSchema
  const parsedBody = actionSchema.safeParse(req.body)

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
    const approveData = parsedBody.data as { approvedQuantity?: number }
    return approveFulfillmentService({
      ...payload,
      approvedQuantity: approveData.approvedQuantity,
    })
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
      message: 'Mutasi stok disetujui dan barang dikirim',
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
      message: 'Barang mutasi telah diterima',
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
      message: 'Permintaan mutasi stok ditolak',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'rejectFulfillment', error)
  }
}
