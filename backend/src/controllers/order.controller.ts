import { Request, Response } from 'express'
import {
  approveFulfillment as approveFulfillmentService,
  cancelOrder as cancelOrderService,
  createCheckoutOrder as createCheckoutOrderService,
  getCheckoutPreview as getCheckoutPreviewService,
  OrderServiceError,
  receiveFulfillment as receiveFulfillmentService,
  rejectFulfillment as rejectFulfillmentService,
  requestOrderFulfillment as requestOrderFulfillmentService,
} from '../services/order.service'
import {
  cancelOrderSchema,
  checkoutQuerySchema,
  createCheckoutOrderSchema,
  fulfillmentActionSchema,
  orderParamsSchema,
  requestFulfillmentSchema,
  stockMutationParamsSchema,
} from '../validations/order.validation'

const getAuthenticatedUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: Login required' })
    return null
  }

  return userId
}

const handleOrderError = (error: unknown, res: Response) => {
  if (error instanceof OrderServiceError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    })
    return true
  }

  return false
}

export const getCheckoutPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = checkoutQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const preview = await getCheckoutPreviewService({
      userId,
      addressId: parsed.data.addressId,
    })

    res.json({
      data: preview,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[getCheckoutPreview]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createCheckoutOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = createCheckoutOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await createCheckoutOrderService({
      userId,
      addressId: parsed.data.addressId,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    })

    res.status(201).json({
      message: 'Order created successfully',
      data: result,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[createCheckoutOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
      return
    }

    const order = await cancelOrderService({
      userId,
      orderId: parsedParams.data.id,
      reason: parsedBody.data.reason,
    })

    res.json({
      message: 'Order cancelled and stock restored',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[cancelOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const adminCancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
      return
    }

    const order = await cancelOrderService({
      userId,
      orderId: parsedParams.data.id,
      reason: parsedBody.data.reason,
      isAdmin: true,
    })

    res.json({
      message: 'Order cancelled and stock restored',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[adminCancelOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const requestOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = requestFulfillmentSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
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

    console.error('[requestOrderFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
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
    res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
    return
  }

  if (!parsedBody.success) {
    res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
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

    console.error('[approveFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
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

    console.error('[receiveFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
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

    console.error('[rejectFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
