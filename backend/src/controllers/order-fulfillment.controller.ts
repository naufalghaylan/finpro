import { Request, Response } from 'express'
import {
  approveFulfillment as approveFulfillmentService,
  approveFulfillments as approveFulfillmentsService,
  listStoreFulfillments as listStoreFulfillmentsService,
  receiveFulfillment as receiveFulfillmentService,
  receiveFulfillments as receiveFulfillmentsService,
  rejectFulfillment as rejectFulfillmentService,
  rejectFulfillments as rejectFulfillmentsService,
  requestOrderFulfillment as requestOrderFulfillmentService,
  requestOrderFulfillments as requestOrderFulfillmentsService,
} from '../services/order.service'
import {
  approveFulfillmentSchema,
  approveFulfillmentsSchema,
  fulfillmentActionSchema,
  fulfillmentListQuerySchema,
  orderParamsSchema,
  receiveFulfillmentSchema,
  receiveFulfillmentsSchema,
  rejectFulfillmentsSchema,
  requestFulfillmentBatchSchema,
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

export const listStoreFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const parsed = fulfillmentListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      sendValidationError(res, parsed.error)
      return
    }

    const result = await listStoreFulfillmentsService({
      actorRole: user.role,
      actorStoreId: user.storeId,
      ...parsed.data,
    })

    res.json(result)
  } catch (error) {
    if (handleOrderError(error, res)) return
    sendInternalError(res, 'listStoreFulfillments', error)
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
