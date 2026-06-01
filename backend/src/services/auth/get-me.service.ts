import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

export const getMeService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      emailVerified: true, 
      profilePicture: true 
    }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};
