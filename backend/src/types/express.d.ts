import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: number
      role: string
      emailVerified: boolean
      iat?: number
      exp?: number
    }
  }
}
