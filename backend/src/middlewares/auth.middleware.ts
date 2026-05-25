import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.cookies?.token

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: No token provided' })
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    ;(req as any).user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' })
  }
}

export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user

  if (!user) {
    res.status(401).json({ message: 'Unauthorized: User not authenticated' })
    return
  }

  if (!user.emailVerified) {
    res.status(403).json({ message: 'Forbidden: Email not verified. Please verify your email to access this feature.' })
    return
  }

  next()
}
