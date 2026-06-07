import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../../lib/prisma'
import { sendVerificationEmail, sendResetPasswordEmail } from '../../lib/mailer'
import { AppError } from '../../utils/AppError'
import { generateVerificationTokenJWT } from './jwt.service'

export class CredentialService {
  static async verifyAccount(data: { token: string; password?: string }) {
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

    const hashedPassword = await bcrypt.hash(password as string, 10);

    await prisma.user.update({
      where: { email: verificationRecord.email },
      data: { emailVerified: true, password: hashedPassword }
    });

    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id }
    });
  }

  static async resendVerification(email: string) {
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
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Return successfully anyway to not leak whether the email exists or not
      return
    }

    if (user.authProvider !== 'CREDENTIALS') {
      throw new AppError(400, 'Fitur ini hanya dapat digunakan untuk user yang melakukan registrasi menggunakan email dan password (bukan social login)')
    }

    // Delete existing reset tokens for this email to invalidate previous requests
    await prisma.resetPasswordToken.deleteMany({ where: { email } })

    const tokenStr = crypto.randomBytes(32).toString('hex')

    await prisma.resetPasswordToken.create({
      data: { 
        email, 
        token: tokenStr, 
        expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour 
      }
    })

    await sendResetPasswordEmail(email, tokenStr)
  }

  static async resetPassword(data: { token: string; newPassword?: string }) {
    const { token, newPassword } = data

    const resetToken = await prisma.resetPasswordToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      throw new AppError(400, 'Invalid or expired token')
    }

    if (resetToken.used) {
      throw new AppError(400, 'Token has already been used')
    }

    if (resetToken.expires < new Date()) {
      throw new AppError(400, 'Token has expired')
    }

    const user = await prisma.user.findUnique({ where: { email: resetToken.email } })
    if (!user) {
      throw new AppError(404, 'User not found')
    }

    const hashedPassword = await bcrypt.hash(newPassword as string, 10)

    // Transaction to update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword }
      }),
      prisma.resetPasswordToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])
  }
}
