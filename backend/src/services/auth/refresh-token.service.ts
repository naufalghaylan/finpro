import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, verifyRefreshToken } from './jwt.service';

export const refreshTokenService = async (token: string) => {
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
    emailVerified: storedToken.user.emailVerified
  };

  const newAccessToken = generateAccessToken(payload);
  return { newAccessToken };
};
