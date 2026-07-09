import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const checkDuplicateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || '' }, { username: username || '' }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.username === username) {
        res.status(400).json({ message: 'Email dan Username sudah terdaftar.' });
        return;
      } else if (existingUser.email === email) {
        res.status(400).json({ message: 'Email sudah terdaftar.' });
        return;
      } else if (existingUser.username === username) {
        res.status(400).json({ message: 'Username sudah digunakan.' });
        return;
      }
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
    } else {
      console.error('[checkDuplicateUser]', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
