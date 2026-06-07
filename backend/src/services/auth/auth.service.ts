import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, generateRefreshToken, generateVerificationTokenJWT } from './jwt.service';
import { sendVerificationEmail } from '../../lib/mailer';

export class AuthService {
  static async login(data: any) {
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
  }

  static async register(data: any) {
    const { name, username, email, role, referralCode } = data;

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
  }

  static async logout(refreshTokenCookie: string | undefined): Promise<void> {
    if (refreshTokenCookie) {
      try {
        await prisma.refreshToken.delete({ 
          where: { token: refreshTokenCookie } 
        }).catch(() => {});
      } catch (e) {
        // Ignore error if token doesn't exist or is already deleted
      }
    }
  }
}
