import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string
  error?: string
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
