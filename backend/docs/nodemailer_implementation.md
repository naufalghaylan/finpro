# Nodemailer & Mailtrap Email Verification Documentation

This document explains the implementation of the email dispatch system used for account verification and password setup in the application.

## Table of Contents
- [Technology Stack](#technology-stack)
- [Configuration & Environment Variables](#configuration--environment-variables)
  - [Required Environment Variables](#required-environment-variables)
- [Implementation Details](#implementation-details)
  - [Mailer Utility File](#mailer-utility-file)
- [Core Functions](#core-functions)
  - [sendVerificationEmail](#sendverificationemailemail-string-token-string-promisevoid)
- [Verification Token Schema & Lifespan](#verification-token-schema--lifespan)
- [Testing / Troubleshooting](#testing--troubleshooting)

---

## Technology Stack

1. **Nodemailer**: The primary Node.js package used to construct, configure, and send emails via SMTP.
2. **Mailtrap (Sandbox)**: Used as the safe SMTP testing server during development (Sandbox mode). Mailtrap intercepts emails sent from the development server so that real users do not receive dummy emails, and developers can inspect the layout, spam score, and delivery.

---

## Configuration & Environment Variables

The mailer is configured via the environment variables defined in the `backend/.env` file.

### Required Environment Variables
Ensure the following variables are defined in your `backend/.env`:

```env
# Mailtrap SMTP Credentials
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Frontend URL (For generating the verification link)
FRONTEND_URL=http://localhost:5173
```

---

## Implementation Details

### Mailer Utility File
- **File Location:** `backend/src/lib/mailer.ts`

The utility sets up a Nodemailer transporter using SMTP options from Mailtrap.

```typescript
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})
```

---

## Core Functions

### `sendVerificationEmail(email: string, token: string): Promise<void>`
Generates and sends an HTML email containing a verification link pointing to the frontend application.

- **Parameters:**
  - `email`: Recipient's email address.
  - `token`: Unique verification token generated on registration or resend request.
- **Link Format:** `${process.env.FRONTEND_URL}/verify?token=${token}`
- **Verification Token Lifespan:** 1 Hour (configured at DB creation level in controllers).

#### HTML Email Template structure:
- **Branding Header:** PanenMart
- **Call-to-Action (CTA):** A styled button link for user verification and password creation.
- **Fallback URL:** Plaintext link for users whose email client disables HTML buttons.
- **Expiration Warning:** Advises the user that the token expires in 1 hour.

#### Example Dispatch Call:
```typescript
import { sendVerificationEmail } from '../lib/mailer'

// Inside controller:
await sendVerificationEmail(email, tokenStr)
```

---

## Verification Token Schema & Lifespan

The backend uses a Prisma model `VerificationToken` to manage verification tokens:

```prisma
model VerificationToken {
  id      Int      @id @default(autoincrement())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
  @@map("verification_tokens")
}
```

When registering a user or resending verification, a 32-byte hex token is generated:
```typescript
const tokenStr = crypto.randomBytes(32).toString('hex')
const expires = new Date(Date.now() + 60 * 60 * 1000) // Exactly 1 hour from now
```

---

## Testing / Troubleshooting

1. **Verify Credentials**: Check if `MAILTRAP_USER` and `MAILTRAP_PASS` are correct. If emails are not appearing in your Mailtrap inbox, verify SMTP ports (typically `2525` or `587` for Mailtrap).
2. **Mail Delivery Failures**: If Mailtrap returns connection errors, check firewall restrictions on port `2525`.
3. **Link Domain**: Ensure `FRONTEND_URL` in backend `.env` matches the port where your frontend server is running (e.g. `http://localhost:5173`).
4. **Internal Server Error (500) during Registration**: If you experience an internal server error when sending a verification email or creating a user, make sure your Prisma client matches the latest schema by running `npx prisma generate`.
