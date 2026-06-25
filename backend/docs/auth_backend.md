# Login & Register API Documentation

This document describes the API endpoints and middlewares for User Registration (passwordless), Email Verification (with password setup), Login, and Authorization.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Middlewares](#middlewares)
  - [1. Authenticate Middleware (`authenticate`)](#1-authenticate-middleware-authenticate)
  - [2. Require Verified Middleware (`requireVerified`)](#2-require-verified-middleware-requireverified)
- [Endpoints](#endpoints)
  - [1. Register User (Passwordless)](#1-register-user-passwordless)
  - [2. Verify Account & Set Password](#2-verify-account--set-password)
  - [3. Resend Verification Email](#3-resend-verification-email)
  - [4. Log In](#4-log-in)
  - [5. Social Login](#5-social-login)
  - [6. Get Current User ("Me")](#6-get-current-user-me)
  - [7. Log Out](#7-log-out)
  - [8. Request Password Reset (Forgot Password)](#8-request-password-reset-forgot-password)
  - [9. Confirm/Execute Password Reset](#9-confirmexecute-password-reset)

---

## Architecture Overview

The Authentication module follows a layered architecture to keep the codebase clean, modular, and easy to test:

- **Controllers (`src/controllers/auth.controller.ts`)**: Keep routes thin. They are solely responsible for handling HTTP requests, validating input payloads (using Zod schemas), and sending HTTP responses.
- **Services (`src/services/auth/`)**: Contain all the core business logic, consolidated into domain-specific classes to keep the codebase maintainable:
  - `AuthService` (`auth.service.ts`): Handles core authentication flows (login, register, logout).
  - `CredentialService` (`credential.service.ts`): Handles token-based account recovery and verification (forgot password, reset password, verify account, resend verification).
  - `SessionService` (`session.service.ts`): Handles active session data and token refresh (getMe, refreshToken).
  - Others like `social-login.service.ts` and `complete-onboarding.service.ts` are kept separate for their specific external integrations.
- **Utilities (`src/utils/cookie.util.ts`)**: Contains helper functions to standardize HTTP-only cookie configuration (`setAuthCookies` and `clearAuthCookies`) for token issuance and revocation.
- **Middlewares (`src/middlewares/auth.middleware.ts`)**: Reusable functions that intercept requests to enforce authentication, session verification, and authorization checks.

---

## Middlewares

### 1. Authenticate Middleware (`authenticate`)
- **File Path:** `src/middlewares/auth.middleware.ts`
- **Description:** Verifies the user's session token. Checks the `token` cookie or the `Authorization: Bearer <token>` header. If successful, stores the decoded payload under `req.user`.
- **Response (401 Unauthorized):**
  ```json
  {
    "message": "Unauthorized: No token provided"
  }
  ```

### 2. Require Verified Middleware (`requireVerified`)
- **File Path:** `src/middlewares/auth.middleware.ts`
- **Description:** Restricts access to endpoints that require the user to have a verified email address (e.g., checkout, order creation). Must be chained after the `authenticate` middleware.
- **Response (403 Forbidden):**
  ```json
  {
    "message": "Forbidden: Email not verified. Please verify your email to access this feature."
  }
  ```

### 3. Check Duplicate User Middleware (`checkDuplicateUser`)
- **File Path:** `src/middlewares/checkDuplicateUser.middleware.ts`
- **Description:** Intercepts the registration request to check if the provided email or username already exists in the database.
- **Response (409 Conflict):**
  ```json
  {
    "message": "Email already registered" 
  }
  ```
  *(or `"Username already taken"`)*

---

## Endpoints

### 1. Register User (Passwordless)
- **Endpoint:** `POST /auth/register`
- **Description:** Registers a new user. The account is created with `emailVerified: false` and a `null` password. Generates a verification token valid for **1 hour** and sends a verification email.
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "CUSTOMER"
  }
  ```
- **Response (Success - 201 Created):**
  ```json
  {
    "message": "User registered successfully. Please verify your account.",
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "role": "CUSTOMER",
      "createdAt": "2026-05-25T09:20:00.000Z"
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email or Username already registered.
  - `500 Internal Server Error`: Usually happens if the database schema is updated but `npx prisma generate` has not been run. Ensure you have run it.

---

### 2. Verify Account & Set Password
- **Endpoint:** `POST /auth/verify`
- **Description:** Finalizes the user's registration by validating the token, encrypting their newly chosen password, setting `emailVerified: true`, and deleting the verification token.
- **Request Body:**
  ```json
  {
    "token": "a1b2c3d4e5f6g7h8i9j0...",
    "password": "mySecurePassword123"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Account verified successfully. You can now login."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Token is missing, invalid, or expired.
- **Notes:**
  - The password is encrypted using `bcryptjs` (salt rounds: 10).

---

### 3. Resend Verification Email
- **Endpoint:** `POST /auth/resend-verification`
- **Description:** Generates a new verification token for the provided email address, deletes any old active tokens for this email, and sends a new verification email.
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Verification email resent successfully."
  }
  ```
- **Response (Success - 200 OK, email not registered/already verified):**
  *Note: To prevent user enumeration, we return a generic success message if the email does not exist.*
  ```json
  {
    "message": "If your email is registered and not verified, a new verification link will be sent."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure or account already verified.

---

### 4. Log In
- **Endpoint:** `POST /auth/login`
- **Description:** Logs in a user. Generates both an Access JWT and a Refresh JWT, returning them inside HTTP-only cookies.
- **Request Body:**
  ```json
  {
    "emailOrUsername": "johndoe",
    "password": "mySecurePassword123",
    "rememberMe": true
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "CUSTOMER",
      "emailVerified": true
    }
  }
  ```
- **Cookies Set:**
  - `accessToken`: HTTP-Only cookie containing the short-lived JWT session token (expires in 15 minutes).
  - `refreshToken`: HTTP-Only cookie containing the long-lived JWT refresh token (expires in 30 days if `rememberMe` is true, otherwise 7 days).
- **Errors:**
  - `401 Unauthorized`: Invalid credentials (incorrect password, unregistered email, or password not set).
  - `401 Unauthorized`: `"Please check your email to verify your account."` (email is registered but `emailVerified` is false).

---

### 5. Social Login
- **Endpoint:** `POST /auth/social-login`
- **Description:** Handles social login (Google). It expects a Google ID token from the frontend. The backend verifies this token directly using `google-auth-library` to extract the user's `email`, `name`, and `authProviderId`. If the email does not exist, it registers a new user with `emailVerified: true`, `authProvider: 'GOOGLE'`, and a `null` password. If the email exists, it logs the user in and links the account to Google.
- **Request Body:**
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsImtpZC...",
    "provider": "GOOGLE"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Social login successful",
    "user": {
      "id": 2,
      "name": "Social User",
      "email": "social.user@example.com",
      "role": "CUSTOMER",
      "emailVerified": true
    }
  }
  ```
- **Cookies Set:**
  - `accessToken`: HTTP-Only cookie containing the short-lived JWT session token (expires in 15 minutes).
  - `refreshToken`: HTTP-Only cookie containing the long-lived JWT refresh token (expires in 7 days).
- **Errors:**
  - `400 Bad Request`: Validation failure (missing token or invalid provider).
  - `401 Unauthorized`: Token verification with Google failed.

---

### 6. Get Current User ("Me")
- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <accessToken>` or `accessToken` cookie.
- **Response (Success - 200 OK):**
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "CUSTOMER",
    "emailVerified": true,
    "createdAt": "2026-05-25T09:20:00.000Z"
  }
  ```

---

### 7. Log Out
- **Endpoint:** `POST /auth/logout`
- **Description:** Clears the HTTP-only `accessToken` and `refreshToken` cookies, and removes the refresh token from the database.
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

### 8. Request Password Reset (Forgot Password)
- **Endpoint:** `POST /auth/forgot-password`
- **Description:** Initiates the password reset process by generating a unique secure token and sending a password reset email. If the email doesn't exist, it returns a generic success message to prevent user enumeration. Only users who registered via Email & Password (`authProvider: 'CREDENTIALS'`) can use this feature.
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "If the email exists, a password reset link has been sent."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure (e.g. invalid email format) or the user is registered via social login (Google).
  - `500 Internal Server Error`: Generic internal server error.

---

### 9. Confirm/Execute Password Reset
- **Endpoint:** `POST /auth/reset-password`
- **Description:** Verifies the reset token, hashes the new password, updates the user's password in the database, and marks the token as used (preventing reuse).
- **Request Body:**
  ```json
  {
    "token": "4e723cf23a8db8...",
    "newPassword": "newSecurePassword123"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Password reset successful. You can now login with your new password."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure, or the token is invalid, expired, or has already been used.
  - `404 Not Found`: User associated with the token does not exist.
  - `500 Internal Server Error`: Generic internal server error.
