import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, generateRefreshToken } from './jwt.service';

export const loginService = async (data: any) => {
  const { emailOrUsername, password, rememberMe } = data;

  const user = await prisma.user.findFirst({ 
    where: { 
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    } 
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new AppError(403, 'Account not verified');
  }

  if (!user.password) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  const payload = { userId: user.id, role: user.role, emailVerified: user.emailVerified };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload, rememberMe);

  // Save refresh token to database
  const expiresAt = new Date();
  if (rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  }

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    }
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, profilePicture: user.profilePicture }
  };
};

