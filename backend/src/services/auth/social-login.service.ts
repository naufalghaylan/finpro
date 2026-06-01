import { OAuth2Client } from 'google-auth-library'
import prisma from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { generateAccessToken, generateRefreshToken } from './jwt.service'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

interface SocialLoginPayload {
  token: string
  provider: 'GOOGLE'
}

export const socialLoginService = async (payload: SocialLoginPayload) => {
  const { token, provider } = payload

  if (provider !== 'GOOGLE') {
    throw new AppError(400, 'Only Google provider is supported currently')
  }

  try {
    // 1. Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const googlePayload = ticket.getPayload()
    if (!googlePayload) {
      throw new AppError(401, 'Invalid Google token payload')
    }

    const { email, name, sub: googleId, picture } = googlePayload

    if (!email) {
      throw new AppError(400, 'Email is missing from Google profile')
    }

    // 2. Find or create the user in the database
    let user = await prisma.user.findUnique({
      where: { email }
    })

    let isNewUser = false

    if (!user) {
      // If user doesn't exist, create a new one
      isNewUser = true
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          profilePicture: picture,
          emailVerified: true,
          authProvider: 'GOOGLE',
          authProviderId: googleId,
          role: 'CUSTOMER'
        }
      })
    } else {
      // If user exists but is logging in with Google, you might want to link accounts
      const updateData: any = {}
      if (user.authProvider !== 'GOOGLE') {
        updateData.authProvider = 'GOOGLE'
        updateData.authProviderId = googleId
        updateData.emailVerified = true // since they verified through Google
      }
      
      // Update profile picture if user doesn't have one but Google provides it
      if (!user.profilePicture && picture) {
        updateData.profilePicture = picture
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        })
      }
    }

    // 3. Generate tokens for our application
    const payload = { userId: user.id, role: user.role, emailVerified: user.emailVerified }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // Save refresh token to database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    })

    // Omit sensitive data
    const { password, ...userWithoutPassword } = user

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
      isNewUser
    }

  } catch (error: any) {
    console.error('[socialLoginService] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Failed to verify Google token')
  }
}
