import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    
    // Optionally update req.body to the parsed data so it gets the correct types
    req.body = parsed.data
    next()
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    
    // Optionally update req.query to the parsed data so it gets the correct types
    // req.query = parsed.data as any
    next()
  }
}
