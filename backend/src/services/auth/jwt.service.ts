import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET || 'fallback-verification-secret';
const RESET_PASSWORD_SECRET = process.env.JWT_RESET_PASSWORD_SECRET || 'fallback-reset-secret';

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const REMEMBER_ME_EXPIRY = process.env.JWT_REMEMBER_ME_EXPIRY || '30d';
const VERIFICATION_EXPIRY = process.env.JWT_VERIFICATION_EXPIRY || '1h';
const RESET_PASSWORD_EXPIRY = process.env.JWT_RESET_PASSWORD_EXPIRY || '15m';

export interface AuthTokenPayload {
  userId: number;
  role: string;
  emailVerified: boolean;
  storeId?: number;
}

export const generateAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY as unknown as number });
};

export const generateRefreshToken = (payload: AuthTokenPayload, rememberMe: boolean = false): string => {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_EXPIRY;
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: expiresIn as unknown as number });
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
};

export const generateVerificationTokenJWT = (payload: { email: string }): string => {
  return jwt.sign(payload, VERIFICATION_SECRET, { expiresIn: VERIFICATION_EXPIRY as unknown as number });
};

export const verifyVerificationTokenJWT = (token: string): { email: string } => {
  return jwt.verify(token, VERIFICATION_SECRET) as { email: string };
};

export const generateResetPasswordTokenJWT = (payload: { email: string }): string => {
  return jwt.sign(payload, RESET_PASSWORD_SECRET, { expiresIn: RESET_PASSWORD_EXPIRY as unknown as number });
};

export const verifyResetPasswordTokenJWT = (token: string): { email: string } => {
  return jwt.verify(token, RESET_PASSWORD_SECRET) as { email: string };
};
