import { Request, Response } from 'express'
import {
  createCheckoutOrder as createCheckoutOrderService,
  getCheckoutPreview as getCheckoutPreviewService,
} from '../services/order.service'
import {
  checkoutQuerySchema,
  createCheckoutOrderSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

export const getCheckoutPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = checkoutQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      sendValidationError(res, parsed.error)
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

    sendInternalError(res, 'getCheckoutPreview', error)
  }
}

export const createCheckoutOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = createCheckoutOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      sendValidationError(res, parsed.error)
      return
    }

    const result = await createCheckoutOrderService({
      userId,
      addressId: parsed.data.addressId,
      shippingMethod: parsed.data.shippingMethod,
      shippingService: parsed.data.shippingService,
      shippingCost: parsed.data.shippingCost,
      paymentMethod: parsed.data.paymentMethod,
      voucherId: parsed.data.voucherId,
      notes: parsed.data.notes,
      discountId: parsed.data.discountId,
    })

    res.status(201).json({
      message: 'Order created successfully',
      data: result,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'createCheckoutOrder', error)
  }
}
