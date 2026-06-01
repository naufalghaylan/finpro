import { generateVerificationTokenJWT } from './jwt.service';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { sendVerificationEmail } from '../../lib/mailer';
import { AppError } from '../../utils/AppError';

export const registerUser = async (data: any) => {
  const { name, username, email, role, referralCode } = data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new AppError(409, 'Email already registered');
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw new AppError(409, 'Username already taken');
  }

  let validReferralCode = null;
  if (referralCode) {
    validReferralCode = await prisma.referralCode.findUnique({ where: { code: referralCode } });
    if (!validReferralCode) {
      throw new AppError(400, 'Invalid referral code');
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, username, email, password: null, role: role || 'CUSTOMER', emailVerified: false },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    });

    const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await tx.referralCode.create({
      data: {
        userId: newUser.id,
        code: newReferralCode,
      }
    });

    if (validReferralCode) {
      await tx.referralUsage.create({
        data: {
          referralCodeId: validReferralCode.id,
          usedByUserId: newUser.id,
        }
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create voucher for new user
      const voucherCodeNew = crypto.randomBytes(6).toString('hex').toUpperCase();
      await tx.voucher.create({
        data: {
          code: voucherCodeNew,
          userId: newUser.id,
          name: 'Referral Bonus Voucher',
          discountType: 'NOMINAL',
          discountValue: 20000,
          minPurchase: 0,
          source: 'REFERRAL',
          expiredAt: expiryDate,
        }
      });

      // Create voucher for referral code owner
      const voucherCodeOwner = crypto.randomBytes(6).toString('hex').toUpperCase();
      await tx.voucher.create({
        data: {
          code: voucherCodeOwner,
          userId: validReferralCode.userId,
          name: 'Referral Reward Voucher',
          discountType: 'NOMINAL',
          discountValue: 20000,
          minPurchase: 0,
          source: 'REFERRAL',
          expiredAt: expiryDate,
        }
      });
    }

    return newUser;
  });

  const tokenStr = generateVerificationTokenJWT({ email });
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { email, token: tokenStr, expires }
  });

  await sendVerificationEmail(email, tokenStr);

  return user;
};
