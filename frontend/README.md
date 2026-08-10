<div align="center">
  <h1>💻 Frontend - Online Grocery</h1>
  <p>The interactive client application for the Online Grocery Web Platform.</p>

  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
</div>

<br/>

> **Overview:** This directory contains the Single Page Application (SPA) built with React 19 and Vite. It consumes the backend REST API to provide a seamless, mobile-responsive e-commerce experience including location-based store routing, robust cart management, and real-time checkout flows.

---

## ✨ Features & Architecture

- **Modern React Stack**: Built using React 19, React Router v7, and bundled with lightning-fast Vite 8.
- **Global State Management**: Uses Zustand 5 for lightweight, scalable management of authentication state, cart data, and user location contexts.
- **Geolocation & Mapping**: Integrates `leaflet`, `react-leaflet`, and `leaflet-geosearch` to pinpoint user locations for nearest-store routing.
- **Responsive UI & Styling**: Styled completely with Tailwind CSS v4. Pre-built components leverage Flowbite React and iconography is powered by Lucide React.
- **Authentication**: Native UI for email/password registration and Google OAuth support (`@react-oauth/google`).
- **Axios Interceptors**: Centralized API request handling inside `src/api/` with interceptors to handle token injection and refreshing.

---

## 📂 Directory Structure

```text
frontend/
├── public/                  # Static assets that bypass Vite's asset pipeline
├── src/
│   ├── api/                 # Axios clients and API route call definitions
│   ├── assets/              # Static files (images, icons) imported via Vite
│   ├── components/          # Reusable, modular UI components (buttons, cards, modals)
│   ├── hooks/               # Custom React hooks for business logic abstraction
│   ├── pages/               # Page-level route views (Home, Checkout, Profile, etc.)
│   ├── store/               # Zustand global state slices
│   ├── types/               # TypeScript interfaces and global type definitions
│   ├── utils/               # Pure helper functions and formatters
│   ├── App.tsx              # Application root and React Router definitions
│   └── main.tsx             # Vite entry point
├── .env.example             # Environment variable template
├── eslint.config.js         # ESLint configuration
├── vite.config.ts           # Vite bundler configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Backend API running locally (refer to the `backend` setup guide)

### Installation & Setup

```bash
# 1. Install dependencies
npm install
```

**2. Configure Environment Variables**
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in the necessary credentials:
```env
VITE_API_URL="http://localhost:3000/api"
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
```

**3. Start the Development Server**
```bash
# Start Vite with HMR (Hot Module Replacement)
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` | Type-checks and builds the production bundle |
| `npm run lint` | `eslint .` | Runs ESLint over the frontend codebase |
| `npm run preview` | `vite preview` | Previews the production build locally |

---

## 🛡️ Frontend Development Guidelines

1. **Component Modularity**: Keep components inside `src/components/` small and reusable. Do not put page-level routing logic in standard components.
2. **State Management**: If a piece of state is only needed in one component, use `useState`. If it needs to be accessed globally (like the user token or cart count), use `src/store/` (Zustand).
3. **API Calls**: Do not use raw `fetch` or `axios` directly in components. Define API calls in `src/api/` and import them to maintain clean architecture.
4. **Validation**: All user inputs (forms, image uploads) must be validated on the client side before being sent to the backend.
