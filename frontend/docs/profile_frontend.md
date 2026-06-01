# Frontend User Profile Documentation

This document describes the structure and implementation details of the frontend User Profile feature, which allows users to view and update their personal information, password, email, profile picture, and view their referral codes and vouchers.

## Architecture & State Management

### 1. Zustand Store (`src/store/profileStore.ts`)
The profile feature utilizes a dedicated Zustand store (`useProfileStore`) to cleanly separate profile-related state from the global authentication state.

**State Variables:**
- `profile`: Holds the current user's data (name, email, phone, role, profilePicture, referralCode, vouchers, etc.).
- `isLoading`: Boolean indicating if the profile is currently being fetched.
- `isUpdating`: Boolean indicating if an update operation (save profile, update email) is in progress.
- `error`: Stores any error messages from the backend.

**Actions:**
- `fetchProfile()`: Calls `GET /api/profile` to populate the state.
- `updateProfile(formData: FormData)`: Calls `PUT /api/profile` to update personal details, password, and avatar. Uses `multipart/form-data` to support file uploads.
- `updateEmail(email: string)`: Calls `PUT /api/profile/email` to initiate an email change.
- `reverifyEmail()`: Calls `POST /api/profile/reverify-email` to resend the verification email.

---

## UI Components

The UI is built using React components styled with standard CSS classes provided in the global `App.css` (e.g., `hero-card`, `button primary`, `button ghost`).

### 1. Profile Page Wrapper (`src/pages/profile/ProfilePage.tsx`)
- Acts as the main entry point for the route `/profile`.
- Protected by an `isAuthenticated` check in `App.tsx`. If a user is not logged in, they are redirected to `/login`.
- Automatically calls `fetchProfile()` upon mounting.
- Arranges the components in a responsive grid layout.

### 2. Profile Form (`src/components/profile/ProfileForm.tsx`)
- Displays and allows editing of `name` and `phone`.
- Displays the user's `referralCode` (read-only) with a convenient "Salin" (Copy to clipboard) button.
- Includes a section to change the password (requires `currentPassword` and `newPassword`).
- Includes a "Lupa password saat ini?" link: If the user forgets their current password, they can click this to trigger a password reset request. It calls the backend endpoint `POST /auth/forgot-password` using the logged-in user's email.
- **Security & Session Invalidation:** For security, immediately after successfully changing the password OR requesting a reset link from the profile page, a success notification is shown, and the user is automatically logged out (`logout()` from `authStore`) after a 2-second delay, redirecting them to the Login page.
- Features a realtime image preview for the `profilePicture` upload using `FileReader`.
- Client-side validation: Restricts image file uploads to 1MB.

### 3. Email Form (`src/components/profile/EmailForm.tsx`)
- Dedicated section for updating the user's email address.
- If the user's `emailVerified` status is `false`, it conditionally renders a prominent warning banner.
- Provides a button to resend the email verification link.

### 4. Voucher Section (`src/components/profile/VoucherSection.tsx`)
- Displays the user's referral code with a large, clear UI.
- Lists all active and unused vouchers belonging to the user.
- Dynamically formats the discount value (e.g., Nominal amount in Rupiah or Percentage).

---

## Theming & Styling Guidelines
The profile pages strictly adhere to the overarching frontend aesthetics:
- **Colors:** Uses `var(--surface)` for cards and `var(--bg)` for the background. `var(--accent)` is used for primary buttons and focus states.
- **Typography:** Uses `Fraunces` for display headers and `Lexend` for body text and form labels.
- **Interactions:** Employs subtle `fadeUp` animations on page load to introduce the cards gracefully. Buttons feature slight scale and shadow transitions on hover.
