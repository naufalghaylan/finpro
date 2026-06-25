import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, verifyRefreshToken } from './jwt.service';

export class SessionService {
  static async refreshToken(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken) {
      throw new AppError(401, 'Invalid refresh token');
    }

    try {
      verifyRefreshToken(token);
    } catch (error) {
      await prisma.refreshToken.delete({ where: { token } });
      throw new AppError(401, 'Refresh token expired');
    }

    const payload = {
      userId: storedToken.user.id,
      role: storedToken.user.role,
      emailVerified: storedToken.user.emailVerified,
      storeId: storedToken.user.storeId || undefined
    };

    const newAccessToken = generateAccessToken(payload);
    return { newAccessToken };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        emailVerified: true, 
        profilePicture: true,
        storeId: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }
}
