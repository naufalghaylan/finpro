import { Request, Response } from 'express'
import { handleMidtransNotification } from '../services/order.service'

export const handleMidtransNotificationWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await handleMidtransNotification(req.body)

    res.json({
      message: 'Midtrans notification processed',
      data: result,
    })
  } catch (error) {
    console.error('[handleMidtransNotificationWebhook]', error)
    res.status(500).json({ message: 'Failed to process Midtrans notification' })
  }
}
