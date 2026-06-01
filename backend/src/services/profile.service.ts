import bcrypt from 'bcryptjs'
import { generateVerificationTokenJWT } from './auth/jwt.service'
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

export const updateProfileService = async (userId: number, data: any, file?: Express.Multer.File) => {
  const { name, phone, currentPassword, newPassword } = data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) throw new AppError(404, 'User not found')

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone

  if (newPassword) {
    if (!user.password) throw new AppError(400, 'Current account does not have a password set. Please use the verify account flow or reset password.')
    if (!currentPassword) throw new AppError(400, 'Current password is required')
    if (!(await bcrypt.compare(currentPassword, user.password))) throw new AppError(401, 'Invalid current password')
    updateData.password = await bcrypt.hash(newPassword, 10)
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
    select: { id: true, name: true, email: true, phone: true, profilePicture: true, role: true, emailVerified: true, createdAt: true },
  })
}

export const updateEmailService = async (userId: number, newEmail: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.email === newEmail) throw new AppError(400, 'New email must be different from the current email')
  
  if (await prisma.user.findUnique({ where: { email: newEmail } })) {
    throw new AppError(409, 'Email is already taken by another user')
  }

  await prisma.user.update({ where: { id: userId }, data: { email: newEmail, emailVerified: false } })
  await generateAndSendVerification(newEmail)
}

export const reverifyEmailService = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.emailVerified) throw new AppError(400, 'Email is already verified')
  
  await generateAndSendVerification(user.email)
}
