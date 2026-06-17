import { Response } from 'express'
import { OrderServiceError } from '../services/order.service'

export const handleOrderError = (error: unknown, res: Response) => {
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
