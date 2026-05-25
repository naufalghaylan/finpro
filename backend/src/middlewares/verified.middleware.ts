import { NextFunction, Request, Response } from 'express'
import prisma from '../lib/prisma'

export const requireVerifiedUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    })

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User not found' })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({ message: 'Forbidden: Email not verified' })
      return
    }

    next()
  } catch (error) {
    console.error('[requireVerifiedUser]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
