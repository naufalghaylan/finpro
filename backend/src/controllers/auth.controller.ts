import { Request, Response } from 'express'
import { registerSchema, loginSchema, verifyAccountSchema, socialLoginSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, completeOnboardingSchema } from '../validations/auth.validation'
import { AppError } from '../utils/AppError'
import * as authService from '../services/auth'
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.util'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const user = await authService.registerUser(parsed.data)
    res.status(201).json({ message: 'User registered successfully. Please verify your account.', user })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[register]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const verifyAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verifyAccountSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    await authService.verifyAccountService(parsed.data)
    res.json({ message: 'Account verified successfully. You can now login.' })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[verifyAccount]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    
    await authService.resendVerificationService(parsed.data.email)
    res.json({ message: 'Verification email resent successfully.' })
  } catch (err: any) {
    if (err instanceof AppError) {
      // Return 200 for resend verification to not leak user existence, or whatever was set in service
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[resendVerification]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const { accessToken, refreshToken, user } = await authService.loginService(parsed.data)

    setAuthCookies(res, accessToken, refreshToken, parsed.data.rememberMe)

    res.json({ message: 'Login successful', user })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[login]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const socialLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = socialLoginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const { accessToken, refreshToken, user, isNewUser } = await authService.socialLoginService(parsed.data)

    setAuthCookies(res, accessToken, refreshToken)

    res.json({ message: 'Social login successful', user, isNewUser })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[socialLogin]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}


export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshTokenCookie = req.cookies?.refreshToken;
  
  await authService.logoutService(refreshTokenCookie);

  clearAuthCookies(res);
  
  res.json({ message: 'Logout successful' })
}

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }

    const { newAccessToken } = await authService.refreshTokenService(token);

    // Note: Re-setting the refresh token creates a rolling/sliding session
    setAuthCookies(res, newAccessToken, token);

    res.json({ message: 'Token refreshed successfully' });
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
    } else {
      console.error('[refreshToken]', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const user = await authService.getMeService(userId)
    res.json(user)
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[getMe]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.forgotPasswordService(req.body.email)
    res.json({ message: 'If the email exists, a password reset link has been sent.' })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[forgotPassword]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.resetPasswordService(req.body)
    res.json({ message: 'Password reset successful. You can now login with your new password.' })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[resetPassword]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const parsed = completeOnboardingSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }

    const result = await authService.completeOnboardingService({ userId, ...parsed.data })
    res.json({ message: 'Onboarding complete', ...result })
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      console.error('[completeOnboarding]', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
