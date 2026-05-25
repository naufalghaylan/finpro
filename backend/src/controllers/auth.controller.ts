import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { registerSchema, loginSchema, verifyAccountSchema, socialLoginSchema, resendVerificationSchema } from '../validations/auth.validation'
import { sendVerificationEmail } from '../lib/mailer'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// ── Register ─────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const { name, username, email, role } = parsed.data

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      res.status(409).json({ message: 'Username already taken' })
      return
    }

    const user = await prisma.user.create({
      data: { name, username, email, password: null, role: role || 'CUSTOMER', emailVerified: false },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    })

    const tokenStr = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: { email, token: tokenStr, expires }
    })

    await sendVerificationEmail(email, tokenStr)

    res.status(201).json({ message: 'User registered successfully. Please verify your account.', user })
  } catch (err) {
    console.error('[register]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Verify Account ────────────────────────────────────────────────────────
export const verifyAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verifyAccountSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const { token, password } = parsed.data

    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationRecord) {
      res.status(400).json({ message: 'Invalid token' })
      return
    }

    if (verificationRecord.expires < new Date()) {
      res.status(400).json({ message: 'Token expired' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { email: verificationRecord.email },
      data: { emailVerified: true, password: hashed }
    })

    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id }
    })

    res.json({ message: 'Account verified successfully. You can now login.' })
  } catch (err) {
    console.error('[verifyAccount]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Resend Verification ───────────────────────────────────────────────────
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    
    const { email } = parsed.data
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.json({ message: 'If your email is registered and not verified, a new verification link will be sent.' })
      return
    }
    
    if (user.emailVerified) {
      res.status(400).json({ message: 'Account is already verified.' })
      return
    }
    
    await prisma.verificationToken.deleteMany({
      where: { email }
    })
    
    const tokenStr = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: { email, token: tokenStr, expires }
    })

    await sendVerificationEmail(email, tokenStr)
    
    res.json({ message: 'Verification email resent successfully.' })
  } catch (err) {
    console.error('[resendVerification]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Login ─────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    const { emailOrUsername, password } = parsed.data

    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      } 
    })
    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    if (!user.emailVerified) {
      res.status(401).json({ message: 'Please check your email to verify your account.' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, emailVerified: user.emailVerified }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    })
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Social Login ──────────────────────────────────────────────────────────
export const socialLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = socialLoginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const { email, name, provider, providerId } = parsed.data

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: { 
          name, 
          email, 
          emailVerified: true, 
          authProvider: provider, 
          authProviderId: providerId 
        }
      })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, emailVerified: user.emailVerified }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'Social login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    })
  } catch (err) {
    console.error('[socialLogin]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Get current user ──────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    console.error('[getMe]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ── Logout ────────────────────────────────────────────────────────────────
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  })
  res.json({ message: 'Logout successful' })
}
