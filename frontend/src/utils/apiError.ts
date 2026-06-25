import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string
  error?: string
}

export type ApiFetchError = {
  message: string
  code: number
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export const getApiErrorCode = (error: unknown, fallback = 500) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.status ?? fallback
  }

  return fallback
}

export const getApiFetchError = (
  error: unknown,
  fallback: string,
  fallbackCode = 500,
): ApiFetchError => ({
  message: getApiErrorMessage(error, fallback),
  code: getApiErrorCode(error, fallbackCode),
})
