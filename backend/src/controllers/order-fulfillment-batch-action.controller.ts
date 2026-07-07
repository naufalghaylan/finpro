import { Request, Response } from 'express'
import {
  approveFulfillments as approveFulfillmentsService,
  receiveFulfillments as receiveFulfillmentsService,
  rejectFulfillments as rejectFulfillmentsService,
} from '../services/order.service'
import {
  approveFulfillmentsSchema,
  receiveFulfillmentsSchema,
  rejectFulfillmentsSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

const handleBatchFulfillmentAction = async (
  req: Request,
  res: Response,
  action: 'approve' | 'receive' | 'reject',
) => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const actionSchema = action === 'approve'
    ? approveFulfillmentsSchema
    : action === 'receive'
      ? receiveFulfillmentsSchema
      : rejectFulfillmentsSchema
  const parsedBody = actionSchema.safeParse(req.body)

  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error)
    return
  }

  const payload = {
    userId,
    mutationIds: parsedBody.data.mutationIds,
    notes: parsedBody.data.notes,
  }

  if (action === 'approve') return approveFulfillmentsService(payload)
  if (action === 'receive') return receiveFulfillmentsService(payload)
  return rejectFulfillmentsService(payload)
}

export const approveFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutations = await handleBatchFulfillmentAction(req, res, 'approve')
    if (!mutations) return
    res.json({
      message: `${mutations.length} produk siap dan mulai dikirim`,
      data: mutations,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return
    sendInternalError(res, 'approveFulfillments', error)
  }
}

export const receiveFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutations = await handleBatchFulfillmentAction(req, res, 'receive')
    if (!mutations) return
    res.json({
      message: `${mutations.length} produk telah diterima`,
      data: mutations,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return
    sendInternalError(res, 'receiveFulfillments', error)
  }
}

export const rejectFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutations = await handleBatchFulfillmentAction(req, res, 'reject')
    if (!mutations) return
    res.json({
      message: `${mutations.length} permintaan mutasi stok ditolak`,
      data: mutations,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return
    sendInternalError(res, 'rejectFulfillments', error)
  }
}
