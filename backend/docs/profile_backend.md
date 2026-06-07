# User Profile API Documentation

This document describes the API endpoints and middlewares for User Profile operations, including retrieving profile details, updating personal data, changing the password, uploading a profile picture, and updating/re-verifying the user's email.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Middlewares](#middlewares)
- [Endpoints](#endpoints)
  - [1. Get Current User Profile](#1-get-current-user-profile)
  - [2. Update Profile](#2-update-profile)
  - [3. Update Email](#3-update-email)
  - [4. Re-verify Email](#4-re-verify-email)

---

## Architecture Overview

The Profile module follows a layered architecture to keep the codebase clean, modular, and easy to test:

- **Controllers (`src/controllers/profile.controller.ts`)**: Keep routes thin. They handle HTTP requests, validate input payloads (using Zod schemas), extract files via Multer, and send HTTP responses.
- **Services (`src/services/profile.service.ts`)**: Contain all the core business logic.
- **Routes (`src/routes/profile.routes.ts`)**: Defines the `/profile` endpoints.

---

## Middlewares

### 1. Authenticate Middleware (`authenticate`)
- **File Path:** `src/middlewares/auth.middleware.ts`
- **Description:** All `/profile` routes are protected by this middleware. It verifies the user's session token.

### 2. Upload Profile Picture Middleware (`uploadProfilePicture`)
- **File Path:** `src/middlewares/upload.middleware.ts`
- **Description:** A Multer instance configured with `memoryStorage`. It strictly filters for `.jpg`, `.jpeg`, `.png`, and `.gif` files, and enforces a **1MB** file size limit.

---

## Endpoints

### 1. Get Current User Profile
- **Endpoint:** `GET /profile`
- **Headers:** `Authorization: Bearer <accessToken>` or `accessToken` cookie.
- **Description:** Retrieves the profile details of the currently logged-in user.
- **Response (Success - 200 OK):**
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "08123456789",
    "profilePicture": "https://res.cloudinary.com/...",
    "role": "CUSTOMER",
    "emailVerified": true,
    "createdAt": "2026-05-25T09:20:00.000Z",
    "referralCode": {
      "code": "REF-ABC123XYZ"
    },
    "vouchers": [
      {
        "id": 1,
        "code": "DISC20K",
        "name": "Diskon Rp 20.000",
        "discountType": "NOMINAL",
        "discountValue": 20000,
        "minPurchase": 50000,
        "expiredAt": "2026-06-25T09:20:00.000Z"
      }
    ]
  }
  ```
- **Errors:**
  - `401 Unauthorized`: Not logged in.
  - `404 Not Found`: User does not exist.

---

### 2. Update Profile
- **Endpoint:** `PUT /profile`
- **Headers:** `Authorization: Bearer <accessToken>` or `accessToken` cookie.
- **Content-Type:** `multipart/form-data`
- **Description:** Updates the user's personal data. Can update `name`, `phone`, `password`, and upload a `profilePicture`.
- **Request Body (Form Data):**
  - `name` (optional): String
  - `phone` (optional): String
  - `currentPassword` (optional): String (required if `newPassword` is provided)
  - `newPassword` (optional): String (min 6 characters)
  - `profilePicture` (optional): File (Image, max 1MB)
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "name": "John Doe Updated",
      "email": "john.doe@example.com",
      "phone": "08123456789",
      "profilePicture": "https://res.cloudinary.com/...",
      "role": "CUSTOMER",
      "emailVerified": true,
      "createdAt": "2026-05-25T09:20:00.000Z",
      "referralCode": {
        "code": "REF-ABC123XYZ"
      },
      "vouchers": []
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure (e.g., file too large, invalid extension, missing current password).
  - `401 Unauthorized`: Invalid current password.

---

### 3. Update Email
- **Endpoint:** `PUT /profile/email`
- **Headers:** `Authorization: Bearer <accessToken>` or `accessToken` cookie.
- **Description:** Updates the user's email address. The user's `emailVerified` status will be set to `false`, and a verification email will be sent.
- **Request Body:**
  ```json
  {
    "email": "new.email@example.com"
  }
  ```
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Email updated successfully. Please check your new email to verify it."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Invalid email format or email is the same as current.
  - `409 Conflict`: Email is already taken by another user.

---

### 4. Re-verify Email
- **Endpoint:** `POST /profile/reverify-email`
- **Headers:** `Authorization: Bearer <accessToken>` or `accessToken` cookie.
- **Description:** Sends a new verification email to the user if their email is not yet verified.
- **Request Body:** None
- **Response (Success - 200 OK):**
  ```json
  {
    "message": "Verification email resent successfully. Please check your email."
  }
  ```
- **Errors:**
  - `400 Bad Request`: Email is already verified.
