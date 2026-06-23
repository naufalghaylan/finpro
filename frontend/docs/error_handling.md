# Panduan Error Handling Frontend (Full-Page Error)

Dokumen ini menjelaskan standar implementasi penanganan error di frontend, khususnya penggunaan komponen `<ErrorPage />` untuk menggantikan satu halaman penuh saat terjadi kegagalan pengambilan data (fetch error) yang krusial.

## Kapan Menggunakan `<ErrorPage />`?

**Gunakan (Full-Page Error)** ketika sebuah halaman 100% bergantung pada satu data utama, dan tanpa data tersebut halaman menjadi rusak/tidak bermakna. Contoh:
- **Halaman Profil (`ProfilePage`)**: Jika data profil gagal dimuat, form profil tidak bisa diisi.


**JANGAN Gunakan (Gunakan Partial Error)** ketika halaman masih bisa berfungsi sebagian. Contoh:
- **Beranda (`HomePage`)**: Jika gagal memuat "Produk Terlaris", cukup tampilkan pesan error kecil di *section* tersebut, jangan gantikan seluruh halaman Beranda.
- **Katalog & Pencarian (`CatalogPage`)**: Jika gagal memuat hasil pencarian, biarkan layout, filter, dan search bar tetap ada. Tampilkan "Gagal memuat produk" di bagian list saja.

---

## Cara Menggunakan (Implementasi Conditional Rendering)

Kita menggunakan pendekatan **Conditional Rendering**. Tujuannya adalah merender ulang halaman dan mengganti isinya dengan `<ErrorPage />` TANPA harus berpindah route/URL.

### 1. Import Komponen
Pastikan mengimpor komponen `ErrorPage` dari folder `error`:
```tsx
import ErrorPage from '../error/ErrorPage'
```

### 2. Siapkan State Lokal untuk Error
Buat state untuk menampung pesan dan kode error:
```tsx
import { useState } from 'react'

const [fetchError, setFetchError] = useState<{message: string, code: number} | null>(null)
```

### 3. Tangkap Error pada Fetch API
Gunakan fungsi `.catch()` pada pemanggilan API, lalu masukkan errornya ke dalam state:
```tsx
import { useEffect } from 'react'
import { useStore } from '../../store/someStore' // Contoh store Zustand

export default function MyPage() {
  const { fetchData } = useStore()
  const [fetchError, setFetchError] = useState<{message: string, code: number} | null>(null)

  useEffect(() => {
    fetchData().catch((error) => {
      console.error('Failed to fetch data:', error)
      setFetchError({
        message: error?.response?.data?.message || 'Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.',
        code: error?.response?.status || 500
      })
    })
  }, [fetchData])

  // Lanjut ke step 4...
```

### 4. Render Bersyarat (Conditional Return)
Tambahkan pengecekan `if` di atas return utama komponen. Jika `fetchError` berisi data, langsung kembalikan komponen `<ErrorPage />` dan hentikan eksekusi kode di bawahnya:

```tsx
  // Jika error terdeteksi, render full-page error
  if (fetchError) {
    return (
      <ErrorPage 
        title="Gagal Memuat Halaman" 
        message={fetchError.message} 
        code={fetchError.code} 
      />
    )
  }

  // Jika sukses, render halaman normal
  return (
    <div className="page">
      <Navbar />
      <main>
        {/* Konten Utama */}
      </main>
      <Footer />
    </div>
  )
}
```

### Properti (Props) `<ErrorPage />` (OPSIONAL)
Komponen `ErrorPage` secara otomatis mendukung pelemparan *props* untuk menyesuaikan pesan yang tampil:
- `title` (opsional): Judul besar pesan error (default: 'Terjadi Kesalahan').
- `message` (opsional): Teks penjelasan detail (default: fallback umum).
- `code` (opsional): Kode HTTP / Error Code (default: '500').

Tombol "Coba Lagi" pada ErrorPage secara default akan memanggil `window.location.reload()` untuk memuat ulang halaman secara penuh.
