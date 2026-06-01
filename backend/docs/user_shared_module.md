# User & Authentication Shared Module

Dokumentasi ini ditujukan untuk tim backend lain (misal: tim Orders, tim Products, tim Promotions) yang membutuhkan akses ke data User, melakukan validasi Role, atau mengambil Profile data secara aman dan terpusat.

## 1. Authentication & Role Middlewares

Gunakan middleware ini pada level routing (di folder `src/routes/`) untuk melindungi endpoint dan memvalidasi peran/akses (roles) dari request.

### A. `authenticate`
Digunakan untuk memastikan request membawa Access Token yang valid. Middleware ini akan melakukan verifikasi JWT dan menambahkan object `req.user` yang berisi informasi dasar:
- `userId`
- `role`
- `emailVerified`

**Lokasi File:** `src/middlewares/auth.middleware.ts`

**Penggunaan:**
```typescript
import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { getSomeData } from '../controllers/some.controller'

const router = Router()
router.get('/data', authenticate, getSomeData)
```

Di layer Controller, Anda bisa mengakses profil dasar melalui:
```typescript
const userId = req.user?.userId;
const userRole = req.user?.role;
```

### B. Role Middlewares
Digunakan **SETELAH** middleware `authenticate` untuk membatasi akses ke Role tertentu. Apabila tidak sesuai, akan me-return HTTP 403 Forbidden.

**Lokasi File:** `src/middlewares/role.middleware.ts`

**Tersedia:**
- `requireSuperAdmin` : Mengizinkan akses HANYA untuk `SUPER_ADMIN`.
- `requireStoreAdmin` : Mengizinkan akses HANYA untuk `STORE_ADMIN`.
- `requireAdmin`      : Mengizinkan akses untuk `SUPER_ADMIN` maupun `STORE_ADMIN`.
- `requireRole(['ROLE_A', 'ROLE_B'])` : Custom fungsi untuk set role dinamis.

**Penggunaan:**
```typescript
import { authenticate } from '../middlewares/auth.middleware'
import { requireSuperAdmin, requireAdmin } from '../middlewares/role.middleware'

// Hanya Super Admin yang bisa akses
router.post('/create-global-discount', authenticate, requireSuperAdmin, controllerFn)

// Super Admin atau Store Admin bisa akses
router.get('/store-dashboard', authenticate, requireAdmin, controllerFn)
```

## 2. UserService (Shared Profile Data)

Jika tim Anda (di layer Service atau Controller) perlu memanggil / fetching data dari tabel `users`, usahakan **TIDAK** memanggil `prisma.user` secara manual kecuali query-nya sangat kompleks. Gunakan helper dari `UserService` agar business logic (seperti standar throw 404 AppError dan relasi dasar) tetap konsisten di satu tempat.

**Lokasi File:** `src/services/user.service.ts`

### A. `getUserById(userId, throwOnNotFound = true)`
Mengambil detail User standar (name, email, role, storeId, profil picture, dsb) berdasarkan ID.

```typescript
import { UserService } from '../services/user.service'

const userDetail = await UserService.getUserById(userId);
console.log(userDetail.name, userDetail.storeId);
```

### B. `getUsersByIds(userIds[])`
Sangat direkomendasikan untuk menghindari isu *N+1 query*. 
Contoh: Ketika Anda melakukan fetch list 10 `Orders`, dan setiap Order memiliki `userId`, panggil ini untuk mengambil profil seluruh user secara batch, lalu petakan (map) di memory.

```typescript
import { UserService } from '../services/user.service'

const orderList = await prisma.order.findMany({ ... });
const userIds = orderList.map(order => order.userId);

const users = await UserService.getUsersByIds(userIds);
// Lalu Anda bisa menyatukan data `order` dan `user`...
```

### C. `getUserByEmail(email)`
Mengambil detail user dari string email-nya. Sama seperti pencarian by ID, otomatis me-return 404 AppError jika `throwOnNotFound` bernilai true (default).

```typescript
import { UserService } from '../services/user.service'

const user = await UserService.getUserByEmail('user@example.com');
```

### D. `hasRole(userId, roles[])`
Cek apakah user tertentu (via database request baru) memiliki role tertentu. Berguna untuk layer service atau Background Cron Job ketika object `req.user` tidak tersedia.

```typescript
import { UserService } from '../services/user.service'

const isAdmin = await UserService.hasRole(userId, ['SUPER_ADMIN', 'STORE_ADMIN']);
```
