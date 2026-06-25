// Membangun URL gambar lengkap dari path yang dikembalikan backend.
// Backend menyimpan foto sebagai path relatif (mis. "/uploads/product-123.jpg")
// yang di-serve di origin backend, bukan di origin frontend (Vite).
export const getImageUrl = (url?: string | null): string => {
  if (!url) return ''
  if (url.startsWith('http')) return url

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}${url}`
}
