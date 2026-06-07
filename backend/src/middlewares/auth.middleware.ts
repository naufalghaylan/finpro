import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth/jwt.service'

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.cookies?.accessToken

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
    const decoded = verifyAccessToken(token)
    req.user = {
      userId: Number(decoded.userId),
      role: String(decoded.role),
      emailVerified: decoded.emailVerified,
      // iat and exp are preserved if needed by checking token manually, but payload has our core items
    }
    next()
  } catch {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' })
  }
}

export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user

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

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ message: 'Forbidden: You do not have permission' })
      return
    }

    next()
  }
}
