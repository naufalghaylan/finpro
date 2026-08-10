<div align="center">
  <h1>🛒 Online Grocery Web Application</h1>
  <p>A full-stack, location-based multi-branch e-commerce platform.</p>

  <!-- Frontend Badges -->
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
  
  <br />

  <!-- Backend Badges -->
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<br/>

> **Overview:** The platform enables buyers to purchase products from their nearest store branch based on real-time geolocation, offering local product stock availability, location-bound promotions, and dynamically calculated shipping fees.

---

## ✨ Key Features

### 📍 Location-Based Store Routing
- **Automatic Geolocation**: Detects user coordinates (latitude/longitude) via browser API or interactive Leaflet maps.
- **Nearest Store Resolution**: Calculates distance to store branches using the Haversine formula and automatically routes product browsing to the nearest branch.
- **Service Radius Control**: Enforces store-specific service radius limits (e.g., max 50 km) with friendly fallbacks to default store data or service-unavailable notifications.

### 🔐 User Authentication & Profile Management
- **Multi-Method Auth**: Supports traditional email/password registration alongside Google OAuth social login.
- **Tokenized Email Verification**: One-time verification link sent via email using Nodemailer & Handlebars templates.
- **Profile & Avatar Management**: User profile updates with image uploads hosted on Cloudinary (strict file extension and 1 MB size validation).
- **Role-Based Access Control (RBAC)**: Supports `CUSTOMER`, `STORE_ADMIN`, and `SUPER_ADMIN` roles.

### 🚚 Address Management & Shipping Calculation
- **Multi-Address Support**: Users can save multiple delivery addresses and designate a primary address.
- **Dynamic Shipping Fee**: Real-time integration with RajaOngkir API based on origin store location, destination address, and total item weights.
- **Shipping Result Caching**: Database caching (`UserShippingCache`) to minimize third-party API overhead.

### 🏪 Store & Admin Management
- **Store Branch Management**: Super Admins can view, create, edit, and soft-delete store locations with granular geographical coordinates.
- **Store Admin Assignment**: Super Admins assign Store Admins to specific store branches to delegate stock and order operations.

### 📦 Products, Inventory & Stock Mutations
- **Unified Catalog, Branch Stock**: Shared master product catalog with branch-isolated stock counts and pricing details.
- **Audit-Log Stock Journals**: Every stock movement (additions, sales, adjustments, cancellations) is logged in `StockJournal` with pre- and post-quantity snapshots.
- **Inter-Store Stock Mutations**: Store Admins can request and approve stock transfers (`StockMutation`) between branches to cover inventory shortages.

### 🏷️ Discounts, Vouchers & Referrals
- **Store-Specific Discounts**: Branch-level product discounts (Percentage, Nominal, BOGO).
- **User Vouchers**: Promo codes, referral rewards, minimum purchase vouchers, and free shipping vouchers.
- **Referral Program**: Automatic referral code generation per user; usage rewards both referrer and referee.

### 💳 Shopping Cart, Checkout & Payments
- **Branch-Bound Shopping Cart**: Cart items linked directly to the selected active store branch.
- **Dual Payment Options**:
  - **Manual Bank Transfer**: Customer uploads payment receipt within payment deadline; Admin verifies and approves.
  - **Payment Gateway**: Seamless online payment processing via Midtrans API integration.
- **Order Lifecycle & Auto-Transitions**: Automated background cron jobs handling unpaid order cancellations, stock returns, and auto-confirmations.

### 📊 Analytics & Sales Reports
- **Reports Dashboard**: Category breakdown, total sales performance, store-specific inventory logs, and trend analytics.

---

## 🛠️ Tech Stack

<details>
<summary><b>💻 Frontend Details</b></summary>
<br/>

- **Core**: React 19, TypeScript, Vite 8
- **Styling & UI**: Tailwind CSS v4, Flowbite React, Lucide React
- **State Management**: Zustand 5
- **Routing**: React Router DOM v7
- **Mapping & Geolocation**: Leaflet, React-Leaflet, Leaflet-Geosearch
- **OAuth Integration**: `@react-oauth/google`
</details>

<details>
<summary><b>⚙️ Backend Details</b></summary>
<br/>

- **Core Engine**: Node.js, Express 5, TypeScript 6
- **Database & ORM**: PostgreSQL, Prisma ORM v7 (PrismaPg adapter)
- **Validation**: Zod schema validation
- **Authentication**: JSON Web Tokens (JWT), Bcryptjs, Cookie-Parser
- **Media & Email**: Cloudinary SDK (image uploads), Nodemailer + Handlebars (emails)
- **Payment & Shipping**: Midtrans Client, RajaOngkir API integration
- **Scheduler**: Node-cron
</details>

---

## 📂 Repository Structure

```text
finpro/
├── frontend/                  # React + TypeScript + Vite + Tailwind CSS app
│   ├── src/
│   │   ├── api/               # Shared Axios client & endpoint calls
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page-level route views
│   │   ├── store/             # Zustand global state stores
│   │   └── types/             # Shared TypeScript definitions
│   └── package.json
│
├── backend/                   # Express + TypeScript + Prisma API service
│   ├── prisma/                # Prisma schema, migrations, and seed scripts
│   ├── src/
│   │   ├── controllers/       # HTTP Request handlers
│   │   ├── middlewares/       # Express auth, validation, & upload middlewares
│   │   ├── repositories/      # Database access abstraction layer
│   │   ├── routes/            # REST API route definitions
│   │   ├── services/          # Business logic services
│   │   └── validations/       # Zod validation schemas
│   └── package.json
│
├── docs/                      # Technical documentation & feature design specs
├── project_scope.md           # Core project requirements & feature boundaries
└── AGENTS.md                  # Detailed repository standards & developer guidelines
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) `v18.0.0` or higher
- [PostgreSQL](https://www.postgresql.org/) database (Local or Cloud e.g., Supabase / Neon)
- `npm` (comes with Node.js)

### 1. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `backend/` root directory (refer to `backend/.env.example`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/grocery_db?schema=public"

JWT_ACCESS_SECRET="your_jwt_access_secret"
JWT_ACCESS_EXPIRY="15m"
# ... include other variables as defined in .env.example
```

**Run Migrations & Start Server:**
```bash
# Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# (Optional) Seed RajaOngkir shipping locations & mock data
npm run db:seed-shipping
npx prisma db seed

# Start the backend development server (API runs at http://localhost:3000)
npm run dev
```

### 2. Frontend Setup

```bash
# 1. Open a new terminal tab and navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `frontend/` root directory (refer to `frontend/.env.example`):
```env
VITE_API_URL="http://localhost:3000/api"
VITE_GOOGLE_CLIENT_ID="your_google_client_id"
```

**Start the Application:**
```bash
# Start the frontend development server (Accessible at http://localhost:5173)
npm run dev
```

---

## 📜 Available NPM Scripts

<details>
<summary><b>Backend (<code>/backend</code>)</b></summary>
<br/>

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `ts-node-dev` | Starts Express development server with live reload |
| `npm run build` | `tsc` | Compiles TypeScript code to JavaScript (`dist/`) |
| `npm run start` | `node dist/index.js` | Runs production JavaScript build |
| `npm run db:migrate` | `prisma migrate dev` | Applies database migrations in dev |
| `npm run db:generate` | `prisma generate` | Generates Prisma client types |
| `npm run db:studio` | `prisma studio` | Opens Prisma GUI to inspect database records |
| `npm run db:seed-shipping` | `tsx prisma/seed-rajaongkir.ts` | Seeds provincial & city shipping data |

</details>

<details>
<summary><b>Frontend (<code>/frontend</code>)</b></summary>
<br/>

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` | Type-checks and builds production bundle |
| `npm run lint` | `eslint .` | Lints frontend codebase |
| `npm run preview` | `vite preview` | Previews production build locally |

</details>

---

## 🗄️ Database & Migration Policy

- **Prisma Schema Location**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- When making schema changes, always execute migrations using:
  ```bash
  cd backend
  npx prisma migrate dev --name <descriptive_migration_name>
  ```
- Use `npx prisma studio` to inspect and test relational data models safely during development.

---

## 📖 Key Project References

- [Authentication Flow Details](docs/auth_flow_details.md)
- [Shipping & Checkout Specs](docs/shipping_and_checkout.md)
