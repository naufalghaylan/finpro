import bcrypt from 'bcryptjs'
import { generateVerificationTokenJWT, generateEmailChangeTokenJWT, verifyEmailChangeTokenJWT } from './auth/jwt.service'
import prisma from '../lib/prisma'
import { sendVerificationEmail } from '../lib/mailer'
import { AppError } from '../utils/AppError'
import cloudinary from '../lib/cloudinary'

const generateAndSendVerification = async (email: string) => {
  await prisma.verificationToken.deleteMany({ where: { email } })
  const tokenStr = generateVerificationTokenJWT({ email })
  await prisma.verificationToken.create({
    data: { email, token: tokenStr, expires: new Date(Date.now() + 60 * 60 * 1000) }
  })
  await sendVerificationEmail(email, tokenStr)
}

export const getProfileService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      phone: true, 
      profilePicture: true, 
      role: true, 
      emailVerified: true, 
      createdAt: true,
      referralCode: {
        select: { code: true }
      },
      vouchers: {
        where: { used: false, expiredAt: { gt: new Date() } },
        select: { id: true, code: true, name: true, discountType: true, discountValue: true, minPurchase: true, expiredAt: true }
      }
    },
  })
  if (!user) throw new AppError(404, 'User not found')
  return user
}

export const updateProfileService = async (userId: number, data: Record<string, unknown>, file?: Express.Multer.File) => {
  const { name, phone, currentPassword, newPassword } = data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) throw new AppError(404, 'User not found')

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone

  if (newPassword) {
    if (!user.password) throw new AppError(400, 'Akun saat ini tidak memiliki password. Silakan gunakan alur verifikasi akun atau reset password.');
    if (!currentPassword) throw new AppError(400, 'Password saat ini harus diisi');
    if (!(await bcrypt.compare(currentPassword as string, user.password))) throw new AppError(401, 'Password saat ini salah');
    updateData.password = await bcrypt.hash(newPassword as string, 10)
  }

  if (file) {
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${Buffer.from(file.buffer).toString('base64')}`,
      { folder: 'finpro/profile-picture' }
    )
    updateData.profilePicture = uploadResponse.secure_url
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { 
      id: true, 
      name: true, 
      email: true, 
      phone: true, 
      profilePicture: true, 
      role: true, 
      emailVerified: true, 
      createdAt: true,
      referralCode: {
        select: { code: true }
      },
      vouchers: {
        where: { used: false, expiredAt: { gt: new Date() } },
        select: { id: true, code: true, name: true, discountType: true, discountValue: true, minPurchase: true, expiredAt: true }
      }
    },
  })
}

//...
export const updateEmailService = async (userId: number, newEmail: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.email === newEmail) throw new AppError(400, 'New email must be different from the current email')
  
  if (await prisma.user.findUnique({ where: { email: newEmail } })) {
    throw new AppError(409, 'Email is already taken by another user')
  }

  // Generate Email Change Token and save it in VerificationToken table for tracking/revocation
  await prisma.verificationToken.deleteMany({ where: { email: newEmail } })
  const tokenStr = generateEmailChangeTokenJWT({ userId, newEmail })
  await prisma.verificationToken.create({
    data: { email: newEmail, token: tokenStr, expires: new Date(Date.now() + 60 * 60 * 1000) }
  })

  // Send the specific email change verification email
  const { sendEmailChangeVerificationEmail } = await import('../lib/mailer')
  await sendEmailChangeVerificationEmail(newEmail, tokenStr)
}

export const verifyEmailChangeService = async (token: string) => {
  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verificationRecord) {
    throw new AppError(400, 'Invalid or expired token')
  }

  if (verificationRecord.expires < new Date()) {
    throw new AppError(400, 'Token has expired')
  }

  let decoded: { userId: number; newEmail: string }
  try {
    decoded = verifyEmailChangeTokenJWT(token)
  } catch (error) {
    throw new AppError(400, 'Invalid token payload')
  }

  // Update the user's email and set it as verified
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { email: decoded.newEmail, emailVerified: true }
  })

  // Delete the token
  await prisma.verificationToken.delete({
    where: { id: verificationRecord.id }
  })
}

export const reverifyEmailService = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.emailVerified) throw new AppError(400, 'Email is already verified')
  
  await generateAndSendVerification(user.email)
}
