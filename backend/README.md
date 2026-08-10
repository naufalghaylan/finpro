<div align="center">
  <h1>⚙️ Backend API - Online Grocery</h1>
  <p>The Express.js REST API powering the Online Grocery Web Application.</p>

  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<br/>

> **Overview:** This directory contains the backend services for the Online Grocery platform. It provides secure RESTful APIs, handles business logic, connects to PostgreSQL using Prisma ORM, and integrates with various 3rd party APIs (Cloudinary, Midtrans, RajaOngkir, Google OAuth, Mailtrap).

---

## ✨ Features & Architecture

- **Clean Architecture**: Organized structurally into `controllers`, `services`, `repositories`, and `validations` layers.
- **RESTful API**: Standardized JSON responses for all endpoints.
- **Authentication & Authorization**: Secure JWT-based auth (access & refresh tokens) and strict Role-Based Access Control (`CUSTOMER`, `STORE_ADMIN`, `SUPER_ADMIN`).
- **Database & ORM**: PostgreSQL paired with Prisma ORM (v7) for type-safe database interactions and automated migrations.
- **Robust Validation**: Server-side request validation using Zod.
- **Background Jobs**: Node-cron scheduled tasks for order expiry, auto-cancellations, and auto-confirmations.
- **File Uploads**: Multer middleware paired with Cloudinary SDK for seamless image uploads.
- **Email Delivery**: Nodemailer combined with Handlebars for rich, dynamic transactional email templates.

---

## 📂 Directory Structure

```text
backend/
├── prisma/                  # Prisma Schema, Migrations, and Seed Scripts
├── src/
│   ├── controllers/         # Request handlers (processes req, calls service, sends res)
│   ├── middlewares/         # Express middlewares (Auth, Error handling, Multer)
│   ├── repositories/        # Database access layer (Prisma calls)
│   ├── routes/              # Express Router definitions
│   ├── services/            # Core business logic
│   ├── validations/         # Zod schemas for input validation
│   ├── utils/               # Helper functions & utilities
│   └── index.ts             # Application entry point
├── .env.example             # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) database

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
Fill in the necessary credentials for PostgreSQL (`DATABASE_URL`), JWT Secrets, Cloudinary, Midtrans, RajaOngkir, and Google OAuth.

**3. Database Setup**
```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations to database
npm run db:migrate

# (Optional) Seed RajaOngkir province and city data
npm run db:seed-shipping
```

**4. Start the Server**
```bash
# Development mode with hot-reload (runs on http://localhost:3000)
npm run dev

# Production build
npm run build
npm run start
```

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `ts-node-dev` | Starts Express dev server with live reload |
| `npm run build` | `tsc` | Compiles TypeScript code to JavaScript |
| `npm run start` | `node dist/index.js` | Runs production JavaScript build |
| `npm run db:migrate` | `prisma migrate dev` | Applies database migrations in dev |
| `npm run db:generate` | `prisma generate` | Generates Prisma client types |
| `npm run db:studio` | `prisma studio` | Opens Prisma GUI to inspect database records |
| `npm run db:seed-shipping` | `tsx prisma/seed-rajaongkir.ts` | Seeds provincial & city shipping data |

---

## 🛡️ Backend Development Guidelines

1. **Separation of Concerns**: Controllers should remain thin. Put business logic in `services/` and database queries in `repositories/`.
2. **Validation**: All incoming requests must be validated at the route layer using Zod schemas located in `validations/`.
3. **Database Changes**: Always use Prisma migrations (`npm run db:migrate`). Do not manually edit the database schema outside of Prisma.
4. **Error Handling**: Use the centralized error handling middleware to ensure consistent error response payloads across the API.
