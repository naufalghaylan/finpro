import bcrypt from 'bcryptjs';
import { generateVerificationTokenJWT } from './jwt.service';
import prisma from '../../lib/prisma';
import { sendVerificationEmail } from '../../lib/mailer';
import { AppError } from '../../utils/AppError';

export const verifyAccountService = async (data: any) => {
  const { token, password } = data;

  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationRecord) {
    throw new AppError(400, 'Invalid token');
  }

  if (verificationRecord.expires < new Date()) {
    throw new AppError(400, 'Token expired');
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: verificationRecord.email },
    data: { emailVerified: true, password: hashed }
  });

  await prisma.verificationToken.delete({
    where: { id: verificationRecord.id }
  });
};

export const resendVerificationService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(200, 'If your email is registered and not verified, a new verification link will be sent.');
  }
  
  if (user.emailVerified) {
    throw new AppError(400, 'Account is already verified.');
  }
  
  await prisma.verificationToken.deleteMany({
    where: { email }
  });
  
  const tokenStr = generateVerificationTokenJWT({ email });
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { email, token: tokenStr, expires }
  });

  await sendVerificationEmail(email, tokenStr);
};
