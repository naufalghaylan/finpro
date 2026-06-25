import crypto from 'crypto'
import prisma from '../../lib/prisma'
import { AppError } from '../../utils/AppError'

interface CompleteOnboardingPayload {
  userId: number
  referralCode?: string
}

export const completeOnboardingService = async (payload: CompleteOnboardingPayload) => {
  const { userId, referralCode } = payload

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError(404, 'User not found')
  }

  // Check if user already has a referral code (already onboarded)
  const existingCode = await prisma.referralCode.findUnique({ where: { userId } })
  if (existingCode) {
    return { referralCode: existingCode.code, alreadyOnboarded: true }
  }

  let validReferralCode = null
  if (referralCode) {
    validReferralCode = await prisma.referralCode.findUnique({ where: { code: referralCode } })
    if (!validReferralCode) {
      throw new AppError(400, 'Kode referral tidak valid')
    }
    if (validReferralCode.userId === userId) {
      throw new AppError(400, 'Tidak bisa menggunakan kode referral milik sendiri')
    }
  }

  const newCode = await prisma.$transaction(async (tx) => {
    const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const created = await tx.referralCode.create({
      data: { userId, code: newReferralCode }
    })

    if (validReferralCode) {
      await tx.referralUsage.create({
        data: {
          referralCodeId: validReferralCode.id,
          usedByUserId: userId,
        }
      })

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)

      const voucherCodeNew = crypto.randomBytes(6).toString('hex').toUpperCase()
      await tx.voucher.create({
        data: {
          code: voucherCodeNew,
          userId,
          name: 'Referral Bonus Voucher',
          discountType: 'NOMINAL',
          discountValue: 20000,
          minPurchase: 0,
          source: 'REFERRAL',
          expiredAt: expiryDate,
        }
      })

      const voucherCodeOwner = crypto.randomBytes(6).toString('hex').toUpperCase()
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
      })
    }

    return created
  })

  return {
    referralCode: newCode.code,
    alreadyOnboarded: false,
    referralCodeUsed: !!validReferralCode
  }
}
