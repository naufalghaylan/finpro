import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const checkDuplicateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username } = req.body;

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new AppError(409, 'Email already registered');
      }
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        throw new AppError(409, 'Username already taken');
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
