import { midtransCore } from '../../../lib/midtrans'

export type MidtransApiError = {
  httpStatusCode?: string | number
  message?: string
  ApiResponse?: {
    status_code?: string | number
    status_message?: string | string[]
    validation_messages?: unknown
  }
}

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')

const isMidtransTransactionNotFoundError = (error: unknown) => {
  const apiError = error as MidtransApiError
  const httpStatusCode = String(apiError.httpStatusCode ?? '')
  const statusCode = String(apiError.ApiResponse?.status_code ?? '')

  return httpStatusCode === '404' || statusCode === '404'
}

export const getMidtransFinishUrl = (orderId: number) => `${getFrontendUrl()}/orders/${orderId}`

export const getMidtransErrorMessage = (error: unknown) => {
  const apiError = error as MidtransApiError
  const statusMessage = apiError.ApiResponse?.status_message

  if (Array.isArray(statusMessage)) return statusMessage.join(', ')
  if (statusMessage) return statusMessage
  if (apiError.message) return apiError.message

  return null
}

export const getMidtransErrorDetails = (error: unknown) => {
  const apiError = error as MidtransApiError

  return {
    httpStatusCode: apiError.httpStatusCode,
    statusCode: apiError.ApiResponse?.status_code,
    statusMessage: apiError.ApiResponse?.status_message,
    validationMessages: apiError.ApiResponse?.validation_messages,
  }
}

export const getMidtransTransactionStatusOrNull = async (orderNumber: string) => {
  try {
    return await midtransCore.transaction.status(orderNumber)
  } catch (error) {
    if (isMidtransTransactionNotFoundError(error)) return null
    throw error
  }
}