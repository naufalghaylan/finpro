# Login & Register API Documentation

This document describes the API endpoints and middlewares for User Registration (passwordless), Email Verification (with password setup), Login, and Authorization.

## Table of Contents
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
- **Description:** Logs in a user. Generates a JWT token and returns it inside an HTTP-only cookie.
- **Request Body:**
  ```json
  {
    "emailOrUsername": "johndoe",
    "password": "mySecurePassword123"
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
  - `token`: HTTP-Only cookie containing the JWT session token (expires in 7 days).
- **Errors:**
  - `401 Unauthorized`: Invalid credentials (incorrect password, unregistered email, or password not set).
  - `401 Unauthorized`: `"Please check your email to verify your account."` (email is registered but `emailVerified` is false).

---

### 5. Social Login
- **Endpoint:** `POST /auth/social-login`
- **Description:** Handles social login providers (e.g. Google). If the email does not exist, it registers the user with `emailVerified: true` and a `null` password.
- **Request Body:**
  ```json
  {
    "email": "social.user@example.com",
    "name": "Social User",
    "provider": "GOOGLE",
    "providerId": "123456789"
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

---

### 6. Get Current User ("Me")
- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <token>` or JWT token cookie.
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
- **Description:** Clears the HTTP-only `token` cookie.
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Logout successful"
  }
  ```
