import type {
  CategoryChip,
  FooterSection,
  NavLink,
  Product,
  PromoSlide,
  StoreLocation,
  ValueProp,
} from '../../types/home/home'

export const BRAND = {
  name: 'PanenMart',
  tagline: 'Belanja segar dekat rumah',
}

export const MAIN_STORE_ID = 'store-main'
export const SERVICE_RANGE_KM = 12

export const navLinks: NavLink[] = [
  { id: 'katalog', label: 'Katalog', href: '/catalog' },
  { id: 'promo', label: 'Produk Harian', href: '/home#deals' },
  { id: 'toko', label: 'Toko', href: '/home#stores' },
  { id: 'bantuan', label: 'Bantuan', href: '/help' },
]

export const categoryChips: CategoryChip[] = [
  { id: 'sayur', label: 'Sayur' },
  { id: 'buah', label: 'Buah' },
  { id: 'protein', label: 'Protein' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'bumbu', label: 'Bumbu' },
  { id: 'siap', label: 'Siap Masak' },
]

export const heroSlides: PromoSlide[] = [
  {
    id: 'slide-harvest',
    kicker: 'Panen Minggu Ini',
    title: 'Sayur segar tiba pagi ini.',
    description:
      'Pilih paket siap masak dari mitra lokal. Semua dikurasi dan dikirim dari toko terdekat.',
    ctaLabel: 'Mulai belanja',
    note: 'Gratis kirim untuk pesanan di atas Rp 150.000',
    highlight: 'Dipilih tim quality control',
  },
  {
    id: 'slide-fruit',
    kicker: 'Buah Pilihan',
    title: 'Buah manis, rantai dingin terjaga.',
    description:
      'Kami jaga suhu sejak kebun sampai ke pintu rumah kamu. Rasa tetap segar dan matang merata.',
    ctaLabel: 'Lihat buah segar',
    note: 'Pengiriman dua jam untuk area inti',
    highlight: 'Kadar manis terukur',
  },
  {
    id: 'slide-protein',
    kicker: 'Protein Harian',
    title: 'Potongan bersih siap masak.',
    description:
      'Kurasi daging dan ikan dengan kualitas konsisten. Cocok untuk menu cepat harian.',
    ctaLabel: 'Pilih protein',
    note: 'Stok dari toko terdekat setiap pagi',
    highlight: 'Tersedia potongan hemat',
  },
]

export const valueProps: ValueProp[] = [
  {
    id: 'value-1',
    title: 'Dipanen dan dikirim cepat',
    description: 'Rata-rata sampai kurang dari 2 jam untuk area inti.',
  },
  {
    id: 'value-2',
    title: 'Kurasi ketat per batch',
    description: 'Setiap batch dicek ulang agar kualitas stabil.',
  },
  {
    id: 'value-3',
    title: 'Transparansi stok per store',
    description: 'Stok tampil sesuai toko terdekatmu secara real-time.',
  },
]

export const storeLocations: StoreLocation[] = [
  {
    id: 'store-main',
    name: 'PanenMart Pusat',
    city: 'Jakarta',
    address: 'Jl. Sudirman No. 45',
    lat: -6.2002,
    lng: 106.8167,
    isMain: true,
  },
  {
    id: 'store-north',
    name: 'PanenMart Utara',
    city: 'Jakarta',
    address: 'Jl. Pluit Raya No. 12',
    lat: -6.1218,
    lng: 106.7915,
  },
  {
    id: 'store-east',
    name: 'PanenMart Timur',
    city: 'Jakarta',
    address: 'Jl. Pemuda No. 88',
    lat: -6.1827,
    lng: 106.8982,
  },
  {
    id: 'store-south',
    name: 'PanenMart Selatan',
    city: 'Jakarta',
    address: 'Jl. Kemang Raya No. 2',
    lat: -6.2671,
    lng: 106.8133,
  },
]

export const products: Product[] = [
  {
    id: 'prod-001',
    name: 'Paket Sayur Harian',
    category: 'Sayur',
    price: 28000,
    unit: 'paket',
    tag: 'Best seller',
    rating: 4.8,
    reviews: 324,
    swatch: 'swatch-olive',
    stocks: {
      'store-main': 120,
      'store-north': 64,
      'store-east': 48,
      'store-south': 78,
    },
  },
  {
    id: 'prod-002',
    name: 'Bayam Organik',
    category: 'Sayur',
    price: 14000,
    unit: 'ikat',
    tag: 'Fresh pick',
    rating: 4.7,
    reviews: 210,
    swatch: 'swatch-leaf',
    stocks: {
      'store-main': 90,
      'store-north': 30,
      'store-east': 55,
      'store-south': 42,
    },
  },
  {
    id: 'prod-003',
    name: 'Jeruk Manis Premium',
    category: 'Buah',
    price: 36000,
    unit: 'kg',
    tag: 'Musim puncak',
    rating: 4.9,
    reviews: 188,
    swatch: 'swatch-citrus',
    stocks: {
      'store-main': 70,
      'store-north': 45,
      'store-east': 35,
      'store-south': 20,
    },
  },
  {
    id: 'prod-004',
    name: 'Apel Honeycrisp',
    category: 'Buah',
    price: 52000,
    unit: 'kg',
    tag: 'Rasa manis',
    rating: 4.8,
    reviews: 142,
    swatch: 'swatch-berry',
    stocks: {
      'store-main': 40,
      'store-north': 22,
      'store-east': 18,
      'store-south': 30,
    },
  },
  {
    id: 'prod-005',
    name: 'Dada Ayam Fillet',
    category: 'Protein',
    price: 46000,
    unit: '500g',
    tag: 'Siap masak',
    rating: 4.7,
    reviews: 305,
    swatch: 'swatch-sand',
    stocks: {
      'store-main': 66,
      'store-north': 34,
      'store-east': 28,
      'store-south': 51,
    },
  },
  {
    id: 'prod-006',
    name: 'Ikan Dori Fillet',
    category: 'Protein',
    price: 62000,
    unit: '500g',
    tag: 'Rantai dingin',
    rating: 4.6,
    reviews: 98,
    swatch: 'swatch-ice',
    stocks: {
      'store-main': 28,
      'store-north': 15,
      'store-east': 20,
      'store-south': 12,
    },
  },
  {
    id: 'prod-007',
    name: 'Susu Segar 1L',
    category: 'Dairy',
    price: 26000,
    unit: 'botol',
    tag: 'Pagi ini',
    rating: 4.5,
    reviews: 76,
    swatch: 'swatch-milk',
    stocks: {
      'store-main': 88,
      'store-north': 40,
      'store-east': 32,
      'store-south': 60,
    },
  },
  {
    id: 'prod-008',
    name: 'Bumbu Rendang Siap',
    category: 'Bumbu',
    price: 32000,
    unit: 'paket',
    tag: 'Siap masak',
    rating: 4.4,
    reviews: 52,
    swatch: 'swatch-spice',
    stocks: {
      'store-main': 55,
      'store-north': 18,
      'store-east': 24,
      'store-south': 20,
    },
  },
]

export const footerSections: FooterSection[] = [
  {
    id: 'layanan',
    title: 'Layanan',
    links: [
      { label: 'Bantuan', href: '/help' },
      { label: 'Pengembalian', href: '/orders' },
      { label: 'Status pesanan', href: '/orders' },
    ],
  },
  {
    id: 'perusahaan',
    title: 'Perusahaan',
    links: [
      { label: 'Tentang PanenMart', href: '/help' },
      { label: 'Mitra petani', href: '/help' },
      { label: 'Karir', href: '/help' },
    ],
  },
  {
    id: 'kontak',
    title: 'Kontak',
    links: [
      { label: 'WhatsApp', href: '/help' },
      { label: 'Email', href: '/help' },
      { label: 'Instagram', href: '/help' },
    ],
  },
]
