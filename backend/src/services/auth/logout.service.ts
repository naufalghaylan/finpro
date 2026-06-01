import prisma from '../../lib/prisma';

export const logoutService = async (refreshTokenCookie: string | undefined): Promise<void> => {
  if (refreshTokenCookie) {
    try {
      await prisma.refreshToken.delete({ 
        where: { token: refreshTokenCookie } 
      }).catch(() => {});
    } catch (e) {
      // Ignore error if token doesn't exist or is already deleted
    }
  }
};
