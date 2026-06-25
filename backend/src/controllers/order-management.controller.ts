import { Request, Response } from 'express'
import {
  cancelOrder as cancelOrderService,
  confirmOrderReceived as confirmOrderReceivedService,
  listAdminOrders as listAdminOrdersService,
  listOrders as listOrdersService,
  shipOrder as shipOrderService,
} from '../services/order.service'
import {
  adminOrderListQuerySchema,
  cancelOrderSchema,
  orderListQuerySchema,
  orderParamsSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = orderListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      sendValidationError(res, parsed.error)
      return
    }

    const result = await listOrdersService({
      userId,
      ...parsed.data,
    })

    res.json(result)
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'listOrders', error)
  }
}

export const listAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const parsed = adminOrderListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      sendValidationError(res, parsed.error)
      return
    }

    const result = await listAdminOrdersService({
      actorRole: user.role,
      actorStoreId: user.storeId,
      ...parsed.data,
    })

    res.json(result)
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'listAdminOrders', error)
  }
}

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!parsedBody.success) {
      sendValidationError(res, parsedBody.error)
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

    sendInternalError(res, 'cancelOrder', error)
  }
}

export const adminCancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!parsedBody.success) {
      sendValidationError(res, parsedBody.error)
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

    sendInternalError(res, 'adminCancelOrder', error)
  }
}

export const shipOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    const order = await shipOrderService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Order marked as shipped',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'shipOrder', error)
  }
}

export const confirmOrderReceived = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    const order = await confirmOrderReceivedService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Order received successfully',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'confirmOrderReceived', error)
  }
}
