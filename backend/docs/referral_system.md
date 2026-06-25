# Sistem Referral dan Voucher

Dokumentasi ini menjelaskan implementasi fitur Referral dan Voucher pada aplikasi PanenMart, yang terintegrasi dalam alur pendaftaran (registrasi) dan profil pengguna.

## Gambaran Umum (Overview)
Fitur ini bertujuan untuk mendorong pertumbuhan pengguna dengan memberikan *reward* (voucher diskon) kepada pengguna baru yang mendaftar menggunakan kode referral pengguna lain, serta memberikan *reward* yang sama kepada pemilik kode referral tersebut.

- **Voucher Reward:** Potongan nominal sebesar Rp 20.000.
- **Masa Berlaku (Expiry):** 30 hari sejak voucher diterbitkan.
- **Minimal Pembelian (Min Purchase):** Tidak ada (Rp 0).
- **Berlaku Untuk (Applicable To):** Semua produk (ALL_PRODUCTS).

---

## 1. Integrasi Database (Prisma Schema)

Fitur ini memanfaatkan beberapa model tabel pada database yang sudah ada:
- **`ReferralCode`**: Menyimpan kode referral unik yang dimiliki oleh setiap pengguna (1 *user* = 1 kode).
- **`ReferralUsage`**: Mencatat *log* penggunaan kode referral saat pengguna baru mendaftar (menghindari penggunaan berulang oleh user yang sama).
- **`Voucher`**: Menyimpan voucher potongan harga yang dapat digunakan saat *checkout* pesanan.

---

## 2. Alur Backend (Backend Flow)

### 2.1 Pendaftaran Pengguna (`registerUser` service)
Lokasi: `backend/src/services/auth/register.service.ts`

- Saat pendaftaran (`/api/auth/register`), aplikasi akan mengekstrak data opsional `referralCode` dari *request body*.
- Aplikasi menggunakan `prisma.$transaction` untuk menjamin konsistensi data. Proses yang terjadi di dalam transaksi:
  1. Membuat entri `User` baru.
  2. Membangkitkan `kode referral` baru secara unik dengan format acak heksadesimal 4 *byte* (contoh: `A1B2C3D4`) untuk *user* baru tersebut.
  3. Menyimpan kode referral baru tersebut di tabel `ReferralCode`.
  4. Jika *request* menyertakan `referralCode` dan terbukti valid (kode milik pengguna lain):
     - Membuat rekam jejak pada `ReferralUsage`.
     - Menerbitkan **Voucher untuk Pengguna Baru** (Nilai Rp 20.000).
     - Menerbitkan **Voucher untuk Pemilik Kode Referral** (Nilai Rp 20.000).

### 2.2 Profil Pengguna (`getProfileService` service)
Lokasi: `backend/src/services/profile.service.ts`

- Pada *endpoint* pemanggilan profil (`/api/profile/me`), *query* dimodifikasi untuk *join* atau mengambil (select):
  - `referralCode.code` milik pengguna.
  - Daftar `vouchers` yang:
    - Belum pernah digunakan (`used: false`).
    - Belum kedaluwarsa (`expiredAt: { gt: new Date() }`).

### 2.3 Cronjob Pengecekan Expired Voucher (`voucher.cron.ts`)
Lokasi: `backend/src/cron/voucher.cron.ts`

- Menggunakan `node-cron` untuk menjalankan pengecekan setiap hari pada jam 00:00 (`0 0 * * *`).
- Fungsi ini akan memeriksa seluruh tabel `Voucher` dan memberikan log terkait jumlah voucher yang belum digunakan namun sudah melewati batas `expiredAt`.
- Hal ini berguna bagi pemantauan/auditing *system logs* harian. Di-inisiasi melalui entri utama `backend/src/index.ts`.

---

## 3. Integrasi Frontend (Frontend Flow)

### 3.1 Halaman Pendaftaran (Register Page)
Lokasi: `frontend/src/pages/auth/RegisterPage.tsx`

- Form pendaftaran memiliki satu *input* tambahan: **Kode Referral (Opsional)**.
- Input ini dilengkapi pesan bantuan untuk memancing pengguna (e.g., "Dapatkan voucher diskon Rp 20.000...").
- *Value* dari *input* dikirimkan ke dalam `register` API call.

### 3.2 Halaman Profil (Profile Page)
Lokasi: `frontend/src/pages/profile/ProfilePage.tsx` & `frontend/src/components/profile/VoucherSection.tsx`

- Menggunakan `profileStore.ts` yang sudah diperbarui tipe (interface) statenya untuk mendukung `referralCode` dan `vouchers`.
- Menambahkan **VoucherSection**:
  - Menampilkan blok **Kode Referral Anda** dengan tombol untuk *Copy to Clipboard* (Salin Kode).
  - Menampilkan daftar **Voucher Saya** yang berisi nama voucher, kode, nilai diskon, dan tanggal kedaluwarsa.
  - Jika tidak ada voucher, menampilkan *state* pesan kosong (empty state) yang rapi.

---

## 4. Cara Pengujian (How to Test)

1. Jalankan aplikasi (Backend di port `5000`, Frontend di port `5173`).
2. Masuk ke halaman **Buat Akun / Register**.
3. Daftarkan akun pertama (User A). Kosongkan kode referral.
4. Verifikasi akun User A dan Login. Masuk ke halaman **Profil**. Catat "Kode Referral" milik User A dari bagian *VoucherSection*.
5. Buka halaman Register kembali dan daftarkan akun kedua (User B). Kali ini masukkan kode referral milik User A.
6. Verifikasi akun User B dan Login. Masuk ke halaman Profil. Anda akan melihat User B memiliki 1 voucher "Referral Bonus Voucher" senilai Rp 20.000.
7. Buka kembali (atau *reload*) profil User A. Anda akan melihat User A kini memiliki 1 voucher "Referral Reward Voucher" senilai Rp 20.000.
8. (Opsional) Cek Terminal Backend di tengah malam untuk melihat Log eksekusi cronjob voucher (Atau bisa memodifikasi string cronjob sementara untuk *testing* setiap menit).
