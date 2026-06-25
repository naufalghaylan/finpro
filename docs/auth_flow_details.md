# JWT Access/Refresh Token Authentication Flow

This document provides a detailed, **code-by-code walkthrough** of the secure Authentication Flow implemented across the backend and frontend.

---

## Architecture Overview

The system uses a **split JWT token strategy** with separate secrets and strict security parameters:
1. **Access Token**:
   - **Secret**: `JWT_ACCESS_SECRET`
   - **Expiry**: `15 minutes` (short-lived)
   - **Storage**: Sent to the browser as an HTTP-only, secure, sameSite cookie.
   - **Use Case**: Sent automatically with every API request to verify the user's identity and roles.
2. **Refresh Token**:
   - **Secret**: `JWT_REFRESH_SECRET`
   - **Expiry**: `7 days` (long-lived)
   - **Storage**: Saved in the database (linked to the user) and sent to the browser as an HTTP-only, secure, sameSite cookie.
   - **Use Case**: Used only to request a new access token when the current access token expires.
3. **Verification & Reset Tokens**:
   - **Secret**: `JWT_VERIFICATION_SECRET` and `JWT_RESET_PASSWORD_SECRET`
   - **Use Case**: Emailed as links to the user. They are short-lived and payload-minimal.

---

## 1. Database Model (Prisma)

### File: `backend/prisma/schema.prisma`
```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}

model User {
  id            Int            @id @default(autoincrement())
  // ... other fields
  refreshTokens RefreshToken[]
}
```

#### Code Explanation:
* **`RefreshToken` model**: Creates a dedicated table to store active refresh tokens.
* **`token String @unique`**: We index and unique-constrain the token for fast lookup during refreshes.
* **`userId Int` & `user User`**: Creates a 1-to-many relationship linking a user to their refresh tokens. 
* **`onDelete: Cascade`**: If a user is deleted from the database, all their associated refresh tokens are cleaned up automatically.
* **`expiresAt DateTime`**: Stores the absolute expiration time of the refresh token. This allows server-side cleanup or manual revocation check.

---

## 2. JWT Service (Backend)

### File: `backend/src/services/auth/jwt.service.ts`
```typescript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET || 'fallback-verification-secret';
const RESET_PASSWORD_SECRET = process.env.JWT_RESET_PASSWORD_SECRET || 'fallback-reset-secret';

export interface AuthTokenPayload {
  userId: number;
  role: string;
  emailVerified: boolean;
}

export const generateAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
};
```

#### Code Explanation:
* **Secrets Separation**: Four separate variables fetch secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, etc.) from environment variables, preventing key reuse. If one key is compromised, others remain secure.
* **`AuthTokenPayload`**: Defines the strict type structure stored inside the JWT token.
* **`generateAccessToken`**: Signs the payload using `ACCESS_SECRET` with a short-lived `15m` duration.
* **`generateRefreshToken`**: Signs the payload using `REFRESH_SECRET` with a long-lived `7d` duration.
* **`verifyAccessToken`/`verifyRefreshToken`**: Verifies and decodes the JWT using the appropriate secret. If verification fails (e.g. signature mismatch or expiration), `jwt.verify` throws an error.

---

## 3. Login Service (Backend)

### File: `backend/src/services/auth/login.service.ts`
```typescript
export const loginService = async (data: any) => {
  // ... checks password and user verification status ...

  const payload = { userId: user.id, role: user.role, emailVerified: user.emailVerified };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Save refresh token to database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    }
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, profilePicture: user.profilePicture }
  };
};
```

#### Code Explanation:
* **Payload Creation**: Sets up user identifiers.
* **Generation**: Calls the service functions to create `accessToken` and `refreshToken`.
* **Database Persistance**: Calculates the `expiresAt` timestamp (7 days from now) and saves the generated refresh token string directly to the DB linked to the user's `userId`. This allows us to track active sessions and invalidate them if needed.

---

## 4. Auth Controller (Backend)

### File: `backend/src/controllers/auth.controller.ts`
```typescript
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.util'

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // ... validates inputs ...
    const { accessToken, refreshToken, user } = await authService.loginService(parsed.data)

    setAuthCookies(res, accessToken, refreshToken)

    res.json({ message: 'Login successful', user })
  } catch (err: any) { ... }
}
```

#### Code Explanation:
* **`setAuthCookies`**: An extracted utility that generates the `cookieOptions` containing strict security boundaries (`httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'none' | 'lax'`). This encapsulates cookie logic safely outside the controller.
* **`res.cookie`**: Inside `setAuthCookies`, it transmits both tokens inside cookies with the appropriate `maxAge` matching the JWT lifetime.

### Token Refresher:
```typescript
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
  } catch (err: any) { ... }
}
```

#### Code Explanation:
* **Token Extraction**: Extracts the `refreshToken` from incoming cookies using `req.cookies`.
* **Refresh Execution**: Calls `refreshTokenService` to validate the token against the database.
* **New Cookie**: Passes both the freshly generated access token and the validated refresh token to `setAuthCookies`, ensuring both tokens are sent securely to the browser, renewing the session effectively for another 15 minutes while extending the sliding window of the refresh token.

### Logout Flow:
```typescript
export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshTokenCookie = req.cookies?.refreshToken;
  
  await authService.logoutService(refreshTokenCookie);

  clearAuthCookies(res);
  
  res.json({ message: 'Logout successful' })
}
```

#### Code Explanation:
* **Session Revocation**: Delegates database cleanup by passing the cookie to `authService.logoutService()`, which removes the refresh token from the database so it can never be used again.
* **Cookie Clearing**: Uses `clearAuthCookies(res)` utility function to safely run `res.clearCookie` on both `accessToken` and `refreshToken` ensuring total obliteration from the client browser.

---

## 5. Refresh Token Service (Backend)

### File: `backend/src/services/auth/refresh-token.service.ts`
```typescript
import prisma from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, verifyRefreshToken } from './jwt.service';

export const refreshTokenService = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!storedToken) {
    throw new AppError(401, 'Invalid refresh token');
  }

  try {
    verifyRefreshToken(token);
  } catch (error) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new AppError(401, 'Refresh token expired');
  }

  const payload = {
    userId: storedToken.user.id,
    role: storedToken.user.role,
    emailVerified: storedToken.user.emailVerified
  };

  const newAccessToken = generateAccessToken(payload);
  return { newAccessToken };
};
```

#### Code Explanation:
* **Database Lookup**: Queries the `RefreshToken` table. If the token is not registered, we reject with a `401`.
* **JWT Expiration Validation**: Checks if the signature is valid and the token has not expired using `verifyRefreshToken(token)`.
* **Expired Token Cleanup**: If verification fails (throws error), the service deletes the expired token from the database to prevent stale records, then returns `401`.
* **Token Issuance**: If valid, we pull the user's details and sign a **new access token**.

---

## 6. Authenticate Middleware (Backend)

### File: `backend/src/middlewares/auth.middleware.ts`
```typescript
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.cookies?.accessToken

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: No token provided' })
    return
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = {
      userId: Number(decoded.userId),
      role: String(decoded.role),
      emailVerified: decoded.emailVerified,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' })
  }
}
```

#### Code Explanation:
* **Token Retrieval**: It checks for `accessToken` inside cookies. If absent, it checks the standard HTTP `Authorization` header (`Bearer <token>`).
* **Validation**: Calls `verifyAccessToken(token)`.
* **Attach User State**: If verified, we decode the contents and attach the user credentials under `req.user`, allowing downstream controllers to query user identities securely. If verification fails, it issues a `401`.

---

## 7. Axios Refresh Interceptor (Frontend)

To make token refresh completely seamless and avoid interrupting the user's session, the client uses an Axios response interceptor.

### File: `frontend/src/api/axios.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Important: Allows sending cookies for cross-origin requests
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic if the request is already trying to hit login or refresh
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh-token');
        processQueue(null, 'refreshed');
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Log out user if refresh fails and they are not already on the login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.startsWith('/verify')) {
           window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### Code-by-Code Walkthrough:

1. **`withCredentials: true`**:
   Configures Axios to include cookies (such as `accessToken` and `refreshToken`) automatically in cross-origin requests. Without this, the browser will not send cookies to the API.

2. **Concurrency Handling Variables**:
   * `isRefreshing`: A boolean lock flag indicating whether the silent token refresh call is currently pending.
   * `failedQueue`: An array that holds promises for requests that failed with `401` while the refresh process is underway.

3. **`processQueue` Helper**:
   Iterates through all queued requests in `failedQueue`. If the token refresh is successful, it resolves the promises (which triggers retries). If the token refresh fails, it rejects all queued requests with the refresh error.

4. **Skipping Excluded Endpoints**:
   ```typescript
   if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
     return Promise.reject(error);
   }
   ```
   Ensures we never attempt to refresh if the request that failed with `401` was the login or the refresh-token endpoint itself. This prevents infinite loops.

5. **`error.response?.status === 401 && !originalRequest._retry`**:
   Catches `401 Unauthorized` responses and checks that we haven't already retried this request (using the `_retry` flag).

6. **Locking & Queueing mechanism**:
   ```typescript
   if (isRefreshing) {
     return new Promise(function(resolve, reject) {
       failedQueue.push({ resolve, reject });
     }).then(() => {
       return api(originalRequest);
     }).catch(err => {
       return Promise.reject(err);
     });
   }
   ```
   If a refresh is already in progress, any subsequent `401` failures do not trigger another refresh request. Instead, they return a new `Promise` which gets pushed into `failedQueue`. When the main refresh call resolves, these queued promises will execute `api(originalRequest)` to retry.

7. **Executing Silent Token Refresh**:
   ```typescript
   originalRequest._retry = true;
   isRefreshing = true;

   try {
     await api.post('/auth/refresh-token');
     processQueue(null, 'refreshed');
     return api(originalRequest);
   }
   ```
   * Marks the current request with `_retry = true`.
   * Acquires the lock (`isRefreshing = true`).
   * Calls `POST /auth/refresh-token` (which verifies the cookie and sets a fresh `accessToken` cookie).
   * Resolves all queued promises via `processQueue(null, 'refreshed')`.
   * Retries the original failed request using `api(originalRequest)` and returns its response.

8. **Error Handling & Session Eviction**:
   ```typescript
   } catch (refreshError) {
     processQueue(refreshError, null);
     if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.startsWith('/verify')) {
        window.location.href = '/login';
     }
     return Promise.reject(refreshError);
   } finally {
     isRefreshing = false;
   }
   ```
   If the refresh token itself has expired or is invalid, the refresh request fails.
   * `processQueue` rejects all queued requests.
   * If the user is on a protected route, we force-redirect them back to `/login`.
   * Resets the lock (`isRefreshing = false`).
