import type { FulfillmentAction } from './storeFulfillmentGroup'

export const storeFulfillmentActionCopy = {
  approve: {
    eyebrow: 'Kesiapan toko sumber',
    title: 'Siapkan dan kirim barang',
    description: 'Stok pesanan sudah dicadangkan saat checkout. Aksi ini menandai barang mulai dikirim ke toko tujuan.',
    confirmation: 'Saya sudah memastikan jumlah dan kondisi barang yang akan dikirim.',
    button: 'Konfirmasi kirim',
  },
  receive: {
    eyebrow: 'Gerbang penerimaan fisik',
    title: 'Konfirmasi barang tiba',
    description: 'Konfirmasi hanya setelah barang benar-benar tiba dan diperiksa. Barang tetap dialokasikan untuk pesanan ini.',
    confirmation: 'Saya sudah melihat, menghitung, dan menerima seluruh barang secara fisik.',
    button: 'Barang sudah diterima',
  },
  reject: {
    eyebrow: 'Tolak permintaan',
    title: 'Tolak mutasi stok',
    description: 'Berikan catatan agar toko peminta mengetahui alasan penolakan.',
    confirmation: '',
    button: 'Tolak permintaan',
  },
} satisfies Record<FulfillmentAction, Record<string, string>>
