import { Request, Response } from 'express'
import { ZodError } from 'zod'

export const getAuthenticatedUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: Login required' })
    return null
  }

  return userId
}

export const sendValidationError = (res: Response, error: ZodError) => {
  res.status(400).json({ message: 'Validation Error', errors: error.flatten().fieldErrors })
}

export const sendInternalError = (res: Response, scope: string, error: unknown) => {
  console.error(`[${scope}]`, error)
  res.status(500).json({ message: 'Internal server error' })
}
