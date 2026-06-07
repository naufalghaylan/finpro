# Frontend Authentication Documentation

This document describes the structure and implementation details of the frontend authentication features, including login, registration, verification, and the newly added forgot password and reset password flows.

## Table of Contents
- [Architecture & State Management](#architecture--state-management)
- [Page Routing and Access Control](#page-routing-and-access-control)
- [Authentication Pages](#authentication-pages)
  - [1. Login Page (`/login`)](#1-login-page-login)
  - [2. Register Page (`/register`)](#2-register-page-register)
  - [3. Verify Account Page (`/verify`)](#3-verify-account-page-verify)
  - [4. Forgot Password Page (`/forgot-password`)](#4-forgot-password-page-forgot-password)
  - [5. Reset Password Page (`/reset-password`)](#5-reset-password-page-reset-password)
- [Security Behaviors & Session Invalidation](#security-behaviors--session-invalidation)

---

## Architecture & State Management

### Zustand Store (`src/store/authStore.ts`)
The application uses a global Zustand store (`useAuthStore`) to manage user authentication state, loading indicators, and API integration.

**State Variables:**
- `user`: Holds the currently authenticated user's details (`id`, `name`, `email`, `role`). `null` if the user is unauthenticated.
- `isAuthenticated`: Boolean indicating if the user is logged in.
- `isLoading`: Boolean indicating if the initial session check or login action is in progress.

**Actions:**
- `login(credentials)`: Submits credentials to `POST /auth/login`. Sets `user` and `isAuthenticated: true` on success.
- `register(userData)`: Submits details to `POST /auth/register` to register a passwordless user.
- `logout()`: Calls `POST /auth/logout` to clear the backend's HTTP-only token cookie, and resets the client-side state.
- `checkAuth()`: Calls `GET /auth/me` to restore the user session (usually called on app mount).

---

## Page Routing and Access Control

Routes are defined in `src/App.tsx`. Access control is handled using specialized route guards:

- **Public-Only Routes:** Pages like `/login`, `/register`, `/forgot-password`, and `/reset-password` are accessible only to unauthenticated users. If an authenticated user visits them, they are redirected to the homepage.
- **Protected Routes (`src/components/common/RouteGuard.tsx`):** Pages like `/profile` require the user to be authenticated. Unauthenticated users are redirected to `/login`, and their intended destination is saved in the state so they can be redirected back after successful login.
- **Verified Routes:** The `VerifiedRoute` component extends `ProtectedRoute` by adding an additional check to ensure that the user's `emailVerified` status is true. This can be used for transactional pages (like `/cart`).

---

## Authentication Pages

### 1. Login Page (`/login`)
- **File Path:** `src/pages/auth/LoginPage.tsx`
- **Description:** Allows credentials-based login or social login (Google).
- **Features:** 
  - Standard fields: Email/Username and Password.
  - Social Login (Google): Integrates the `@react-oauth/google` library. The `GoogleLoginButton` component (`src/components/auth/GoogleLoginButton.tsx`) handles the OAuth popup and receives a Google ID Token. This token is passed to `authStore.socialLogin()` which sends it to `POST /auth/social-login`.
  - Redirects users to their last visited page (if accessed from a protected route) or to the homepage upon successful login.
  - **Unverified Users Guard**: If a user attempts to log in but their email is not yet verified, the backend will reject the login with a 403 error. The frontend catches this error, displays a warning toast, and automatically redirects the user to the Verify Account (`/verify`) page.
  - Features a link to the Forgot Password page (`/forgot-password`).

### 2. Register Page (`/register`)
- **File Path:** `src/pages/auth/RegisterPage.tsx`
- **Description:** Handles passwordless registration.
- **Features:**
  - Fields: Name, Username, Email, and Role.
  - Social Login (Google): Displays a Google Login button to quickly register using a Google account without filling out the form.
  - Client-side validation: Validates fields before sending requests.
  - After a successful submission, instructs the user to check their email for verification.

### 3. Verify Account Page (`/verify`)
- **File Path:** `src/pages/auth/VerifyAccountPage.tsx`
- **Description:** The landing page for registration verification.
- **Features:**
  - Extracts the verification `token` from the URL query string.
  - Prompts the user to set their password.
  - Submits the token and password to `POST /auth/verify`.
  - Once verified, prompts the user to log in.

### 4. Forgot Password Page (`/forgot-password`)
- **File Path:** `src/pages/auth/ForgotPasswordPage.tsx`
- **Description:** Allows users who forgot their credentials to request a secure password reset link.
- **Features:**
  - Fields: Email address.
  - Submits the email address to `POST /auth/forgot-password`.
  - Displays a success alert/message if submitted successfully.
  - Includes a link to return to the login page.

### 5. Reset Password Page (`/reset-password`)
- **File Path:** `src/pages/auth/ResetPasswordPage.tsx`
- **Description:** Verifies the reset token and lets the user choose a new password.
- **Features:**
  - Extracts the reset `token` from the URL query string (`?token=<token>`).
  - Validation:
    - Enforces matching "Password Baru" and "Konfirmasi Password Baru".
    - Enforces a minimum length of 6 characters for the password.
  - Submits the `token` and `newPassword` to `POST /auth/reset-password`.
  - **Redirect behavior:** Shows a success notification and automatically redirects the user to `/login` after 3 seconds.

---

## Security Behaviors & Session Invalidation

To maintain security and prevent unauthorized access:
1. **Reset Password Enforcement:** Reset tokens expire after 1 hour and can only be used once. Attempting to use an expired or already-used token results in a validation error.
2. **Profile Password Change:** Changing the password from the Profile form requires entering the user's `currentPassword` to verify identity.
3. **Automatic Logouts:**
   - Changing the password from the profile page will automatically trigger a global logout after a 2-second delay to invalidate the active session.
   - Requesting a password reset link from within the profile page using the "Lupa password saat ini?" link will also immediately request the link and log the user out after a 2-second delay, redirecting them to the Login page.
