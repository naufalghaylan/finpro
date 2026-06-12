# Dokumentasi Backend: Fitur Manajemen Toko dan Admin Toko

Dokumen ini dirancang khusus bagi pemula untuk memahami fitur **Manajemen Toko** dan **Manajemen Admin Toko** yang telah ditambahkan pada *backend* proyek Finpro.

Fitur utama yang dibuat meliputi:
1. **Membedakan Akses Data Toko**: `SUPER_ADMIN` bisa melihat semua toko, sedangkan `STORE_ADMIN` hanya bisa melihat data tokonya sendiri.
2. **Manajemen Akun Admin Toko**: `SUPER_ADMIN` bisa melihat seluruh daftar admin, membuat akun admin baru tanpa batas, dan menempatkan (*assign*) admin tersebut ke toko tertentu.

---

## 1. Perubahan pada API Toko (Store)

Tujuan: Agar API daftar toko (`GET /api/stores`) tidak hanya bisa diakses oleh Super Admin, melainkan juga oleh Store Admin (namun Store Admin hanya akan mendapat data toko mereka sendiri).

### A. Rute Toko (`src/routes/store.routes.ts`)
Di sini kita mendefinisikan URL (jalur) untuk API. Kita menggunakan _middleware_ `authenticate` (memastikan user sudah login) dan `authorize` (memastikan user memiliki jabatan yang tepat).

```typescript
// File: backend/src/routes/store.routes.ts

// Sebelumnya hanya SUPER_ADMIN yang bisa mengakses.
// Kini STORE_ADMIN juga diizinkan mengakses GET /api/stores.
router.get('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getStores);
```

### B. Controller Toko (`src/controllers/store.controller.ts`)
*Controller* bertugas menangkap permintaan dari klien (contohnya *browser*), mengekstrak informasi yang dibutuhkan, dan menyerahkannya ke *Service*.

```typescript
// File: backend/src/controllers/store.controller.ts
export const getStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    
    // Mengekstrak User ID dan Role dari Token JWT (dibuat saat login)
    const userId = req.user?.userId;
    const role = req.user?.role;

    // Memanggil Service dan mengirimkan userId beserta role-nya
    const result = await getStoresService(page, limit, search, userId, role);

    res.status(200).json({
      message: 'Stores fetched successfully',
      data: result.stores,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
```

### C. Service dan Repository Toko (`src/services/store.service.ts` & `src/repositories/store.repository.ts`)
*Repository* bertugas "berbicara" secara langsung ke *Database* melalui Prisma (alat bantu basis data).

```typescript
// File: backend/src/repositories/store.repository.ts
export const getStoresRepository = async (skip: number, take: number, search?: string, userId?: number, role?: string) => {
  // Jika ada 'search', kita mencari toko berdasarkan namanya
  const where: any = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
  
  // LOGIKA UTAMA PEMBEDAAN HAK AKSES:
  // Jika yang meminta data adalah seorang STORE_ADMIN
  if (role === 'STORE_ADMIN' && userId) {
    // Cari data user tersebut di database untuk mengetahui ID Toko-nya
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.storeId) {
      // Ubah filter database agar hanya mengembalikan toko miliknya
      where.id = user.storeId;
    } else {
      // Jika dia tidak punya toko, paksa agar tidak ada toko yang tampil
      where.id = -1; 
    }
  }

  // Mengambil data dari database dengan filter yang sudah dimodifikasi
  const [stores, total] = await Promise.all([
    prisma.store.findMany({ 
      where, 
      skip, 
      take, 
      include: { _count: { select: { admins: true } } }, // Hitung total admin di toko ini
      orderBy: { createdAt: 'desc' }
    }),
    prisma.store.count({ where })
  ]);
  return { stores, total };
};
```

---

## 2. Pembuatan API Manajemen Admin Toko Baru

Super Admin membutuhkan menu untuk memanipulasi _Store Admin_ (seperti HRD mengatur karyawan). Kita membuat rute URL baru dengan awalan `/api/users/admins`.

### A. Rute User (`src/routes/user.routes.ts` & `src/routes/index.ts`)
Kita membuat _router_ khusus user dan mendaftarkannya di _file_ pusat `index.ts`.

```typescript
// File: backend/src/routes/user.routes.ts
import { Router } from 'express';
import { getStoreAdmins, createStoreAdmin, assignStoreAdmin } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// HANYA SUPER_ADMIN YANG BOLEH MEMBUAT ATAU MENGUBAH ADMIN
router.get('/admins', authenticate, authorize('SUPER_ADMIN'), getStoreAdmins);
router.post('/admins', authenticate, authorize('SUPER_ADMIN'), createStoreAdmin);
router.put('/admins/:id/assign', authenticate, authorize('SUPER_ADMIN'), assignStoreAdmin);

export default router;
```

```typescript
// File: backend/src/routes/index.ts
// ... imports lainnya
import userRouter from './user.routes'

const router = Router()
// Mendaftarkan URL /users ke seluruh project
router.use('/users', userRouter)
```

### B. Validasi Input (`src/validations/user.validation.ts`)
Sebelum data diproses, kita menggunakan `Zod` (alat bantu validasi) untuk memastikan email benar berformat email, dan password minimal 6 karakter.

```typescript
// File: backend/src/validations/user.validation.ts
import { z } from 'zod';

export const createStoreAdminSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    storeId: z.number().optional().nullable() // Boleh kosong jika admin belum ditugaskan
  })
});
```

### C. Logic Utama / Service User (`src/services/user.service.ts`)
*File* ini melakukan pembuatan *password* yang di-enkripsi (_hashing_ menggunakan _bcrypt_) dan memasukkan admin ke tabel `User`.

```typescript
// File: backend/src/services/user.service.ts
import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcryptjs'

export class UserService {
  // 1. Mengambil Semua Store Admin
  static async getStoreAdmins() {
    return await prisma.user.findMany({
      where: { role: 'STORE_ADMIN' },
      include: {
        store: { select: { id: true, name: true } } // Minta database juga melampirkan data toko
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 2. Membuat Store Admin Baru
  static async createStoreAdmin(data: any) {
    // Cek apakah email sudah dipakai orang lain
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError(400, 'Email already registered');

    // Acak (hash) password agar tidak terbaca di database
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Simpan ke database
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'STORE_ADMIN',
        storeId: data.storeId || null,
        emailVerified: true // Otomatis diverifikasi karena dibuat oleh Super Admin
      }
    });
  }

  // 3. Menugaskan Store Admin ke sebuah Toko
  static async assignStoreAdmin(adminId: number, storeId: number | null) {
    return await prisma.user.update({
      where: { id: adminId },
      data: { storeId: storeId } // Mengganti ID toko si admin
    });
  }
}
```

### D. Controller User (`src/controllers/user.controller.ts`)
Menerima respon dari *Service* dan mengirimkannya kembali ke Frontend.

```typescript
// File: backend/src/controllers/user.controller.ts
export const createStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validasi data yang dikirim frontend menggunakan Zod
    const validatedData = createStoreAdminSchema.parse({ body: req.body });
    
    // Panggil Service untuk menyimpan ke DB
    const admin = await UserService.createStoreAdmin(validatedData.body);

    // Kirim konfirmasi berhasil
    res.status(201).json({ message: 'Admin created successfully', data: admin });
  } catch (error: any) {
    // Kirim pesan error jika gagal
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};
```

### E. Fungsi Pengambilan Data dan Penugasan Admin (Controller Lainnya)
Selain fungsi pembuatan, *Controller* juga bertugas memberikan daftar seluruh admin dan memproses penugasan admin ke suatu toko.

```typescript
// File: backend/src/controllers/user.controller.ts (Lanjutan)

// Mengambil seluruh Store Admin
export const getStoreAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    // Memanggil Service untuk mengambil data
    const admins = await UserService.getStoreAdmins();
    res.status(200).json({ message: 'Store admins fetched successfully', data: admins });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Menugaskan Store Admin ke Toko
export const assignStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id); // ID admin dari URL (parameter)
    const { storeId } = req.body;            // ID toko dari form yang dikirim Frontend
    
    // Memanggil Service untuk mengubah data di Database
    const admin = await UserService.assignStoreAdmin(adminId, storeId);
    res.status(200).json({ message: 'Store admin assigned successfully', data: admin });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};
```

---

## 3. Integrasi Frontend (Tampilan Aplikasi)

Setelah bagian *Backend* (server) selesai dibuat, kita perlu membuat antarmuka penggunanya (UI) di *Frontend* agar pengguna dapat mengklik dan melihat data dengan mudah tanpa harus mengetik kode.

### A. Jembatan Komunikasi Frontend ke Backend (API Client)
Frontend perlu alat untuk "menelepon" Backend. Kita membuat beberapa fungsi kecil menggunakan `axios` (alat untuk melakukan *HTTP request*). Semua *file* ini disimpan di dalam folder `frontend/src/api/`.

```typescript
// File: frontend/src/api/user.ts
import api from './axios'; // Alat komunikasi kita ke backend

// Fungsi untuk meminta daftar semua Store Admin dari backend
export const getStoreAdmins = async () => {
  const response = await api.get('/users/admins');
  return response.data;
};

// Fungsi untuk mengirim data pembuatan Store Admin baru ke backend
export const createStoreAdmin = async (data: { name: string; email: string; password: string; storeId?: number | null }) => {
  const response = await api.post('/users/admins', data);
  return response.data;
};

// Fungsi untuk menugaskan (atau membatalkan tugas) admin ke suatu toko
export const assignStoreAdmin = async (adminId: number, storeId: number | null) => {
  // Mengirim data 'storeId' untuk admin yang memiliki 'adminId' tersebut
  const response = await api.put(`/users/admins/${adminId}/assign`, { storeId });
  return response.data;
};
```

Selain API User di atas, Frontend juga butuh API Toko (`frontend/src/api/store.ts`) untuk mengambil daftar nama toko (`getStores`) guna memunculkan opsi di dalam *dropdown* (menu pilihan toko).

### B. Halaman Manajemen Admin Toko (`src/pages/admin/AdminStoreAdminList.tsx`)
Ini adalah *file* inti untuk tampilan layar Manajemen Admin Toko. Di sini kita menggunakan React (alat bantu pembuat UI) untuk menampilkan daftar admin dan membuat "*Pop-up* (Modal)" untuk menambah atau menugaskan admin.

Berikut adalah gambaran besar cara kerjanya:

1. **State Management (`useState`)**: Kita membuat "memori ingatan sementara" pada halaman ini. 
   - `admins`: untuk menyimpan daftar admin.
   - `stores`: untuk menyimpan daftar toko.
   - `createModalOpen`: untuk mengingat apakah *pop-up* tambah admin sedang terbuka atau tertutup.
2. **Pengambilan Data Otomatis (`useEffect`)**: Saat halaman pertama kali dibuka, React akan otomatis menjalankan perintah `fetchAdmins()` dan `fetchStoresData()` untuk menelepon backend dan mengambil datanya, lalu disimpan ke dalam "memori" (State).
3. **Tabel Data**: Kita menggunakan HTML dasar seperti `<table>`, `<thead>`, `<tbody>`, dan `<tr>` untuk menyusun data ke dalam bentuk baris dan kolom. Data di dalam "memori" akan dicetak berulang-ulang (*mapping*) menjadi barisan tabel.
4. **Pop-up Form (Modal)**: Terdapat 2 *form* tersembunyi yang hanya akan muncul ketika tombol ditekan:
   - *Modal Pembuatan Admin*: Meminta input Nama, Email, Password, dan Pilihan Toko. Setelah diklik "Simpan", frontend akan memanggil `createStoreAdmin()` di API Client.
   - *Modal Penugasan Admin*: Berisi pilihan *dropdown* (`<select>`) daftar toko. Super Admin bisa memilih toko yang ingin ditugaskan atau memilih opsi "Lepas Penugasan". Setelah diklik, fungsi `handleAssignSubmit()` akan terpanggil.

Contoh kodenya (disederhanakan untuk pemahaman yang lebih mudah):

```tsx
// File: frontend/src/pages/admin/AdminStoreAdminList.tsx

// 1. Mengimpor fungsi "telepon backend" yang dibuat sebelumnya
import { getStoreAdmins, assignStoreAdmin } from '../../api/user';
import { getStores } from '../../api/store';
import { useState, useEffect } from 'react';

export default function AdminStoreAdminList() {
  // 2. State untuk menyimpan data sementara (Memori)
  const [admins, setAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  
  // 3. Fungsi yang otomatis dijalankan saat halaman pertama kali dimuat
  useEffect(() => {
    // Meminta backend mengirimkan data admin, lalu menyimpannya ke state "admins"
    getStoreAdmins().then(result => setAdmins(result.data));
    // Meminta backend mengirimkan data toko (untuk dropdown penugasan)
    getStores(1, 100).then(result => setStores(result.data));
  }, []);

  // 4. Tampilan Halaman (HTML/JSX)
  return (
    <div>
      <h3>Daftar Store Admin</h3>
      <button>+ Tambah Admin</button>

      {/* Tabel yang mengulang (mapping) data dari state admins */}
      <table>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id}>
              <td>{admin.name}</td>
              <td>{admin.email}</td>
              {/* Cek apakah admin punya toko. Jika ada, tampilkan namanya. Jika tidak, tulis Belum Ditugaskan */}
              <td>{admin.store ? admin.store.name : 'Belum Ditugaskan'}</td>
              <td>
                <button>Tugaskan Toko</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Kesimpulan Alur Kerja Keseluruhan
Jika dibayangkan sebagai sebuah restoran cepat saji:
1. **Frontend UI (`AdminStoreAdminList.tsx`)** adalah pelayan di depan (*cashier*) yang menerima dan menampilkan pesanan kepada pelanggan / Super Admin (misal: "Tampilkan data", "Buatkan admin baru").
2. **API Client (`user.ts` & `axios.ts`)** adalah kabel mikrofon atau mesin POS yang mengirimkan pesanan pelayan kepada dapur di belakang.
3. **Backend Routes (`user.routes.ts`)** adalah resepsionis dapur yang menentukan pesanan ini masuk kategori mana dan akan dikerjakan oleh siapa (misal: "Ini pesanan user, tolong bagian user yang urus!").
4. **Backend Controllers (`user.controller.ts`)** adalah koki kepala yang memastikan pesanan lengkap dan jelas, lalu membagi tugas ke koki spesialis.
5. **Backend Services (`user.service.ts`)** adalah koki spesialis yang mengolah bahan makanan (membuat *password* rahasia, memvalidasi aturan keamanan).
6. **Backend Repositories (`store.repository.ts`) & Prisma** adalah asisten gudang yang bertugas menaruh dan mengambil kotak bahan makanan langsung dari dalam kulkas.
7. **Database (PostgreSQL)** adalah kulkas besar itu sendiri, tempat semua data mentah disimpan dengan aman.
