import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === 'string' || !decoded || !('userId' in decoded)) {
      res.status(401).json({ message: 'Unauthorized: Invalid token payload' })
      return
    }

    req.user = {
      userId: Number(decoded.userId),
      role: String(decoded.role),
      iat: decoded.iat,
      exp: decoded.exp,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' })
  }
}
