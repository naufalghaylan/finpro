# Backend Bootstrap Documentation

## Overview

This backend is built with **Express.js**, **TypeScript**, and **Prisma ORM v7** using **PostgreSQL** (hosted on Supabase) as the database. It follows a layered architecture: routes → controllers → lib/services.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| TypeScript | ~6.0 | Type safety |
| Express.js | ^5.x | HTTP framework |
| Prisma ORM | ^7.x | Database ORM |
| `@prisma/adapter-pg` | ^7.x | Prisma v7 PostgreSQL driver adapter |
| `pg` | latest | Node.js PostgreSQL driver |
| `bcryptjs` | ^3.x | Password hashing |
| `jsonwebtoken` | ^9.x | JWT auth tokens |
| `dotenv` | ^17.x | Environment variable loading |
| `cors` | ^2.x | Cross-Origin Resource Sharing |
| `ts-node-dev` | ^2.x | Dev server with hot reload |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (models + enums)
│   └── migrations/            # Migration history (created after prisma migrate dev)
├── prisma.config.ts           # Prisma v7 CLI config (datasource URL lives here)
├── src/
│   ├── index.ts               # Entry point — loads env, starts HTTP server
│   ├── app.ts                 # Express app setup (middleware, routes, error handlers)
│   ├── generated/
│   │   └── prisma/            # Auto-generated Prisma Client (DO NOT EDIT)
│   │       ├── client.ts      # Main import target
│   │       ├── enums.ts       # Generated enums
│   │       └── ...
│   ├── lib/
│   │   └── prisma.ts          # Singleton PrismaClient instance (with PrismaPg adapter)
│   ├── controllers/
│   │   └── auth.controller.ts # Request handlers for auth routes
│   ├── routes/
│   │   ├── index.ts           # Root API router — mounts all sub-routers at /api
│   │   └── auth.routes.ts     # Auth endpoints: register, login, /me
│   └── middlewares/
│       └── auth.middleware.ts # JWT Bearer token verification middleware
├── docs/
│   └── bootstrap.md           # This file
├── .env                       # Local environment variables (never commit this)
├── tsconfig.json              # TypeScript compiler config
└── package.json
```

---

## Environment Variables (`.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://USER:PASS@host:5432/db` | PostgreSQL connection string |
| `JWT_SECRET` | `some-random-secret` | Secret used to sign/verify JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin for CORS |

> ⚠️ Copy `.env` to your local machine and fill in real values. Never commit it to Git.

---

## Prisma v7 — Key Differences

Prisma v7 introduced several **breaking changes** compared to v5/v6:

### 1. Driver Adapter Required
The new `"prisma-client"` engine no longer includes a built-in database driver. You must provide one via a **driver adapter**:

```ts
// src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

### 2. `url` Removed from `schema.prisma`
The `DATABASE_URL` is no longer declared in the `datasource` block. It lives in `prisma.config.ts`:

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

### 3. New Generator Provider & Output
The generator uses `"prisma-client"` (not `"prisma-client-js"`) and requires an explicit `output` path:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### 4. Import Path Changed
```ts
// ❌ Old
import { PrismaClient } from '@prisma/client'

// ✅ New (v7)
import { PrismaClient } from '../generated/prisma/client'
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Health check |
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT token |
| `GET` | `/api/auth/me` | ✅ Bearer | Get current user profile |

### Example: Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Example: Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Example: Get Me (protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload |
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Run compiled production server |
| `db:migrate` | `npm run db:migrate` | Run Prisma migrations |
| `db:generate` | `npm run db:generate` | Regenerate Prisma Client |
| `db:push` | `npm run db:push` | Push schema to DB without migration |
| `db:studio` | `npm run db:studio` | Open Prisma Studio (DB GUI) |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # then edit DATABASE_URL and JWT_SECRET

# 3. Generate Prisma Client
npm run db:generate

# 4. Run migrations (once Supabase DB is connected)
npm run db:migrate

# 5. Start dev server
npm run dev
```

---

## Adding New Features

### Adding a new route
1. Create `src/controllers/your-feature.controller.ts`
2. Create `src/routes/your-feature.routes.ts`
3. Mount it in `src/routes/index.ts`:
   ```ts
   router.use('/your-feature', yourFeatureRouter)
   ```

### Adding a new Prisma model
1. Add the model to `prisma/schema.prisma`
2. Run `npm run db:migrate` (creates a migration)
3. Run `npm run db:generate` (regenerates the client)
