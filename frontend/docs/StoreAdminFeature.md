# Dokumentasi Frontend: Fitur Manajemen Toko dan Admin Toko

Dokumen ini disusun untuk menjelaskan cara kerja sistem **Manajemen Toko** pada sisi tampilan pengguna (*Frontend*). Panduan ini ditulis selangkah demi selangkah agar sangat ramah bagi pemula.

Secara teknis, kita telah mengubah halaman "Admin Toko" menjadi sebuah **Nested Route** (Rute Bersarang). Ini artinya kita menggunakan satu URL induk (`/admin/stores`), namun konten halamannya bisa berganti-ganti ("Daftar Toko" atau "Daftar Admin") seperti halnya kita mengeklik tab pada *browser*, tanpa berpindah halaman sepenuhnya.

---

## 1. Mendaftarkan Rute Bersarang (Nested Routing)

Di aplikasi React, kita mengatur alamat web (URL) menggunakan *Router* di *file* `App.tsx`. Di sinilah kita mendefinisikan rute induk dan rute anak-anaknya.

```tsx
// File: frontend/src/App.tsx

// Mengimpor file-file tampilan halaman (Page) dari folder pages/admin
import AdminStoreLayout from './pages/admin/AdminStoreLayout';
import AdminStoreList from './pages/admin/AdminStoreList';
import AdminStoreAdminList from './pages/admin/AdminStoreAdminList';

function App() {
  return (
    <Routes>
      {/* 
        URL /admin/stores memanggil `AdminStoreLayout` sebagai "Bungkus" (Layout utama)
        Di dalamnya terdapat rute-rute anak yang akan disuntikkan ke dalam bagian tengah Layout.
      */}
      <Route path="/admin/stores" element={<AdminStoreLayout />}>
        {/* Jika user mengakses /admin/stores saja, secara otomatis akan dialihkan (Redirect) ke tab /admin/stores/list */}
        <Route index element={<Navigate to="list" replace />} />
        
        {/* Konten Tab 1: Daftar Toko (bisa diakses oleh Super Admin dan Store Admin) */}
        <Route path="list" element={<AdminStoreList />} />
        
        {/* Konten Tab 2: Daftar Admin (HANYA bisa diakses oleh Super Admin) */}
        <Route path="admins" element={<AdminStoreAdminList />} />
      </Route>
    </Routes>
  );
}
```

---

## 2. Membuat Komponen Layout Utama (Kerangka Halaman)

*File* ini (`AdminStoreLayout.tsx`) menjadi kerangka dinding dari halamannya. Kerangka ini berisi Navbar (Menu Atas), Judul Halaman, dan Tombol-Tombol Tab Navigasi. Bagian tengah dari kerangka ini dibiarkan bolong (menggunakan komponen `<Outlet />`) agar bisa diisi oleh halaman rute anak.

```tsx
// File: frontend/src/pages/admin/AdminStoreLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore'; // Alat untuk mengecek data user yang sedang login

export default function AdminStoreLayout() {
  const { user } = useAuthStore();
  const location = useLocation(); // Mengambil info URL saat ini (misal: "/admin/stores/admins")
  
  // Memeriksa siapa yang sedang login berdasarkan 'role'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="page">
      <main className="shell">
        <h2>Manajemen Operasional</h2>

        {/* Tab navigasi HANYA akan ditampilkan jika yang login adalah Super Admin */}
        {isSuperAdmin && (
          <div className="tabs">
            <Link to="/admin/stores/list">Daftar Toko</Link>
            <Link to="/admin/stores/admins">Daftar Admin</Link>
          </div>
        )}

        {/* 
          PENTING: Komponen <Outlet /> adalah "lubang" tempat React Router 
          akan memasukkan komponen anak (AdminStoreList ATAU AdminStoreAdminList) 
          tergantung URL mana yang sedang dibuka.
        */}
        <div style={{ marginTop: '20px' }}>
          <Outlet />
        </div>

      </main>
    </div>
  );
}
```

---

## 3. Menghubungkan Frontend ke Backend (API Client)

Agar tombol di halaman web berfungsi (bisa mengambil data atau menyimpan data ke *database* di server), kita butuh "Jembatan Komunikasi" atau sering disebut *API Client*. Kita menggunakan alat bernama `axios`. 

Semua fungsi jembatan ini kita simpan di dalam folder `frontend/src/api/`.

### A. API Pengguna (User API)
*File* ini berisi fungsi-fungsi untuk mengelola daftar Store Admin.

```typescript
// File: frontend/src/api/user.ts
import api from './axios'; // Alat komunikasi utama kita ke backend

// 1. Meminta daftar semua Store Admin dari backend
export const getStoreAdmins = async () => {
  const response = await api.get('/users/admins'); // Menembak endpoint GET /api/users/admins
  return response.data;
};

// 2. Mengirim data admin baru ke backend (Nama, Email, Password, ID Toko)
export const createStoreAdmin = async (data: { name: string; email: string; password: string; storeId?: number | null }) => {
  const response = await api.post('/users/admins', data);
  return response.data;
};

// 3. Mengubah toko yang ditugaskan ke seorang admin
export const assignStoreAdmin = async (adminId: number, storeId: number | null) => {
  const response = await api.put(`/users/admins/${adminId}/assign`, { storeId });
  return response.data;
};
```

### B. API Toko (Store API)
Selain mengelola admin, halaman kita juga butuh menarik daftar nama toko (agar bisa dipilih di *dropdown* menu penugasan). Ini kita letakkan di *file* terpisah.

```typescript
// File: frontend/src/api/store.ts
import api from './axios';

// Meminta daftar toko dari backend
export const getStores = async (page: number = 1, limit: number = 10, search?: string) => {
  const params = { page, limit, search };
  const response = await api.get('/stores', { params });
  return response.data;
};
```

---

## 4. Komponen Halaman Inti: Daftar Admin (`AdminStoreAdminList.tsx`)

Ini adalah halaman paling kompleks di fitur ini. Halaman ini bertugas menampilkan tabel daftar admin beserta tombol "Tambah Admin" dan "Tugaskan Toko". 

Mari kita pecah konsepnya secara sederhana:

1. **State (Memori Ingatan)**: React menggunakan fungsi `useState` untuk mengingat data sementara. Contohnya:
   - `admins`: Mengingat daftar admin yang sudah diambil dari backend.
   - `loading`: Mengingat apakah saat ini sistem sedang memuat data (`true`) atau sudah selesai memuat data (`false`). Ini sangat berguna untuk menampilkan animasi berputar (*Loading Spinner*) agar pengguna tahu sistem sedang bekerja.
   - `assignModalOpen`: Mengingat apakah jendela Pop-up penugasan sedang terbuka atau tertutup.
2. **Efek Otomatis (`useEffect`)**: Digunakan untuk memerintahkan React mengambil data dari *backend* secara otomatis tepat di saat halaman pertama kali dibuka.
3. **Penanganan Kesalahan (AxiosError)**: Jika terjadi kegagalan saat menembak server (misalnya server mati, atau validasi gagal), kita menggunakan alat bantu `AxiosError` untuk menangkap pesan penolakan dari server, lalu memunculkannya di layar dengan kotak peringatan (`alert()`).
4. **Desain Tampilan (Tailwind CSS & Lucide Icons)**: Pada versi terbarunya, kita menggunakan kelas-kelas desain (seperti `className="flex items-center"`) untuk mempercantik dan mengatur posisi tabel secara langsung di dalam HTML, serta menggunakan ikon-ikon cantik dari perangkat bantu `lucide-react` (seperti ikon Tambah, Pengaturan User, dan Animasi *Loading*).

Berikut adalah gambaran besar kodenya yang telah disederhanakan untuk kemudahan pemahaman Anda:

```tsx
// File: frontend/src/pages/admin/AdminStoreAdminList.tsx
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios'; // Alat bantu untuk membaca pesan Error
import { Plus, UserCog, Loader2 } from 'lucide-react'; // Kumpulan icon cantik
import { getStoreAdmins, assignStoreAdmin } from '../../api/user';
import { getStores } from '../../api/store';

export default function AdminStoreAdminList() {
  // --- 1. STATE (MEMORI SEMENTARA) ---
  
  // Memori untuk menyimpan data yang akan ditampilkan di tabel
  const [admins, setAdmins] = useState([]); 
  const [stores, setStores] = useState([]); 
  
  // Memori untuk indikator pemuatan data (Loading)
  const [loading, setLoading] = useState(false);
  
  // Memori untuk menampilkan/menyembunyikan Modal (Pop-up) Penugasan Toko
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null); // Mengingat admin mana yang mau ditugaskan
  const [selectedStoreId, setSelectedStoreId] = useState(''); // Mengingat ID Toko yang dipilih

  // --- 2. PENGAMBILAN DATA OTOMATIS ---
  
  // Fungsi khusus untuk mengambil data admin
  const fetchAdmins = async () => {
    setLoading(true); // Nyalakan animasi loading
    try {
      const result = await getStoreAdmins();
      setAdmins(result.data); // Simpan datanya jika berhasil
    } catch (error) {
      console.error('Gagal memuat data', error);
    } finally {
      setLoading(false); // Matikan animasi loading, baik hasilnya sukses maupun gagal
    }
  };

  useEffect(() => {
    // Panggil fungsi pengambilan data saat halaman dibuka
    void fetchAdmins();
    
    // Meminta backend mengirimkan data toko untuk opsi dropdown (batas 100 toko)
    getStores(1, 100).then(result => setStores(result.data));
  }, []);

  // --- 3. FUNGSI TOMBOL (HANDLER) ---
  
  // Fungsi ketika tombol "Simpan" di pop-up penugasan diklik
  const handleAssignSubmit = async (e) => {
    e.preventDefault(); // Mencegah browser melakukan proses loading (reload) layar utuh
    
    try {
      // Panggil fungsi API Backend, kirimkan ID Admin dan ID Toko yang baru
      await assignStoreAdmin(selectedAdmin.id, Number(selectedStoreId));
      
      setAssignModalOpen(false); // Tutup jendela pop-up penugasan
      fetchAdmins(); // Panggil fungsi pengambilan data admin lagi untuk menyegarkan isi tabel
    } catch (e) {
      // Tangkap pesan Error secara spesifik
      const error = e as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message ?? 'Gagal menugaskan admin');
    }
  };

  // --- 4. TAMPILAN HALAMAN (JSX / HTML di dalam JavaScript) ---
  return (
    <div>
      <div className="flex justify-between items-center">
        <h3>Daftar Store Admin</h3>
        <button onClick={() => setCreateModalOpen(true)}>
          <Plus /> Tambah Admin
        </button>
      </div>

      {/* --- TABEL ADMIN (Dengan Pengecekan Loading) --- */}
      {/* Jika loading sedang true, tampilkan animasi. Jika false, tampilkan tabel */}
      {loading ? (
        <div>
           <Loader2 className="animate-spin" /> Memuat data admin...
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Toko yang Ditugaskan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td>{admin.name}</td>
                <td>{admin.email}</td>
                <td>{admin.store ? admin.store.name : 'Belum Ditugaskan'}</td>
                <td>
                  <button onClick={() => {
                    setSelectedAdmin(admin);
                    setAssignModalOpen(true);
                  }}>
                    <UserCog /> Tugaskan Toko
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* POP-UP (MODAL) PENUGASAN SAMA SEPERTI SEBELUMNYA */}
    </div>
  );
}
```

---

## Ringkasan Konsep untuk Pemula

Mari kita ibaratkan sistem **Frontend** ini sebagai sebuah **Restoran Mewah**:

1. **`App.tsx` (Papan Penunjuk Arah dan Pintu Masuk)**: Ini adalah peta di depan pintu restoran yang mengatakan, "Untuk urusan manajemen toko, silakan berjalan menuju ruangan utama di `/admin/stores`."
2. **`AdminStoreLayout.tsx` (Ruangan Utama Restoran)**: Ini adalah ruangannya. Di dalam ruangan ini ada meja pendaftaran (Navbar) dan buku menu (Tab Navigasi di atas). Namun di tengah ruangan, ada satu meja kosong besar yang sengaja dibiarkan bolong (komponen `<Outlet />`). Meja kosong ini akan diisi hidangan berdasarkan buku menu (tab) apa yang sedang dipilih oleh tamu (Super Admin).
3. **`AdminStoreAdminList.tsx` (Hidangan Utama)**: Ini adalah menu makanan yang disajikan di meja kosong tersebut ketika tamu mengeklik tab "Daftar Admin". Di sini, makanan (Data Admin) ditata rapi dalam bentuk piring-piring berjajar ke bawah (Tabel HTML).
4. **`State` / `useState` (Buku Catatan Pelayan)**: React sebagai Pelayan memiliki buku catatan khusus (`useState`) untuk mengingat setiap pesanan, mengingat data-data yang masuk, mengingat tulisan nama dan email yang sedang diketik, serta mengingat apakah harus membuka jendela Pop-up atau tidak.
5. **`API Client` (Radio Walkie-Talkie Pelayan)**: Saat pesanan pelanggan selesai dicatat dan dikonfirmasi lewat klik tombol "Simpan", pelayan (React) tidak memasaknya sendiri di depan. Ia menggunakan *Walkie-Talkie* (`axios` di folder `/api/`) untuk mengirimkan sinyal pesanan ke Dapur Utama di belakang layar (*Backend Server*). Ketika balasan sukses dan makanan dari dapur matang, ia baru menyegarkan buku catatannya dan memberikannya kepada tamu.
