import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const checkDuplicateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username } = req.body;

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
        select: { emailVerified: true },
      });
      if (existingEmail) {
        throw new AppError(
          409,
          existingEmail.emailVerified
            ? 'Email already registered'
            : 'Email already registered but not verified. Please resend the verification email.',
        );
      }
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });
      if (existingUsername) {
        throw new AppError(409, 'Username already taken');
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
