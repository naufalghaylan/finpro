import { Response } from 'express';
import jwt from 'jsonwebtoken';

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttpsClient = process.env.CORS_ORIGIN?.startsWith('https') || false;

  return {
    httpOnly: true,
    secure: isProduction || isHttpsClient,
    sameSite: (isProduction || isHttpsClient) ? 'none' as const : 'lax' as const,
  };
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, rememberMe: boolean = false) => {
  const cookieOptions = getCookieOptions();

  const decodedAccess = jwt.decode(accessToken) as jwt.JwtPayload;
  const accessMaxAge = decodedAccess?.exp ? (decodedAccess.exp * 1000) - Date.now() : 15 * 60 * 1000;

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: accessMaxAge,
  });

  const decodedRefresh = jwt.decode(refreshToken) as jwt.JwtPayload;
  const refreshMaxAge = decodedRefresh?.exp 
    ? (decodedRefresh.exp * 1000) - Date.now() 
    : (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: refreshMaxAge,
  });
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
