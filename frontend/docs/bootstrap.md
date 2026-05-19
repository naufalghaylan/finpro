# Frontend Bootstrap Documentation

## Overview

This frontend is built with **Vite**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It is the client-side application that communicates with the Express.js backend at `http://localhost:5000`.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | ^8.x | Build tool & dev server |
| React | ^19.x | UI framework |
| TypeScript | ~6.0 | Type safety |
| Tailwind CSS | ^4.x | Utility-first CSS framework |
| `@tailwindcss/vite` | ^4.x | Tailwind v4 Vite integration plugin |

---

## Project Structure

```
frontend/
├── public/                    # Static assets served as-is
│   └── icons.svg              # SVG icon sprite
├── src/
│   ├── main.tsx               # React entry point — mounts <App /> to #root
│   ├── App.tsx                # Root component (replace with your app shell)
│   ├── App.css                # Component-level styles for App
│   ├── index.css              # Global styles + Tailwind directives
│   └── assets/                # Images and static assets imported in components
├── docs/
│   └── bootstrap.md           # This file
├── index.html                 # HTML entry point (Vite reads this)
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # Root TypeScript config
├── tsconfig.app.json          # TypeScript config for src/
├── tsconfig.node.json         # TypeScript config for Vite config file
└── package.json
```

---

## Tailwind CSS v4

This project uses **Tailwind CSS v4**, which has a significantly different setup from v3:

### What Changed in v4
- **No `tailwind.config.js`** — configuration is done entirely in CSS using `@theme`.
- **New Vite plugin** — uses `@tailwindcss/vite` instead of PostCSS.
- **Import via CSS** — you import Tailwind with `@import "tailwindcss"` in your CSS file.

### Setup in this project

**`vite.config.ts`**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**`src/index.css`**
```css
@import "tailwindcss";

/* Custom theme tokens go here using @theme */
@theme {
  --color-primary: #6d28d9;
}
```

> ℹ️ All Tailwind utility classes work exactly the same as in v3. Only the config mechanism changed.

---

## Vite Configuration

The current `vite.config.ts` is minimal:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### Recommended additions

**Path aliases** (add `@` → `src/`):
```ts
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Proxy to backend** (avoids CORS in dev):
```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
```

---

## Connecting to the Backend

The backend runs at `http://localhost:5000`. All API calls should go through `/api`.

### Example: Login request with fetch
```ts
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const data = await response.json()
// data.token — store this in localStorage or a context
```

### Authenticated request
```ts
const token = localStorage.getItem('token')

const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## Environment Variables

Vite exposes env variables prefixed with `VITE_` to the client:

Create a `.env.local` file (never commit):
```
VITE_API_URL=http://localhost:5000
```

Access in code:
```ts
const API_URL = import.meta.env.VITE_API_URL
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server at `http://localhost:5173` |
| `build` | `npm run build` | Type-check and build production bundle to `dist/` |
| `preview` | `npm run preview` | Preview the production build locally |
| `lint` | `npm run lint` | Run ESLint |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# App runs at: http://localhost:5173
```

---

## Recommended Next Steps

These are the typical things to build out after the bootstrap:

### 1. Set up a router
Install and configure React Router v7:
```bash
npm install react-router
```

### 2. Set up an HTTP client
Install Axios for easier API calls:
```bash
npm install axios
```

Or use `@tanstack/react-query` for server state management:
```bash
npm install @tanstack/react-query
```

### 3. Set up state management
For global auth state, use React Context or Zustand:
```bash
npm install zustand
```

### 4. Add a UI library
Since the stack mentions "UI Library", popular choices:
- **shadcn/ui** — Tailwind-based, composable components
- **Radix UI** — Headless, accessible primitives
- **Mantine** — Full-featured component library

### 5. Folder structure suggestion
As the app grows, expand `src/` like this:
```
src/
├── api/          # Axios instances, API call functions
├── components/   # Reusable UI components
├── pages/        # Route-level page components
├── hooks/        # Custom React hooks
├── stores/       # Zustand stores or Context providers
├── types/        # Shared TypeScript interfaces/types
└── utils/        # Helper functions
```

---

## TypeScript Configuration

The project uses three `tsconfig` files:

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root config — references the two below |
| `tsconfig.app.json` | Config for `src/` code (React components) |
| `tsconfig.node.json` | Config for `vite.config.ts` (Node environment) |

This split is the standard Vite + TypeScript pattern — it allows stricter settings for app code while allowing Node globals in the config file.
