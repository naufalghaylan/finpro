import { Request, Response } from 'express'
import { listStoreFulfillments as listStoreFulfillmentsService } from '../services/order.service'
import { fulfillmentListQuerySchema } from '../validations/order.validation'
import { sendInternalError, sendValidationError } from './controller.utils'
import { handleOrderError } from './order-error.util'

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
