import { Response } from 'express';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, rememberMe: boolean = false) => {
  const cookieOptions = getCookieOptions();

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  const refreshTokenMaxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAge,
  });
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
