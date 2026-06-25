import type { AdminOrder } from '../../types/order'

export type FulfillmentConfirmation = {
  type: 'approve' | 'receive'
  mutationId: number
  title: string
  message: string
  confirmLabel: string
  tone: 'success' | 'info'
}

export function createApproveFulfillmentConfirmation(
  order: AdminOrder,
  mutationId: number,
): FulfillmentConfirmation {
  const mutation = order.stockMutations.find((item) => item.id === mutationId)

  return {
    type: 'approve',
    mutationId,
    title: 'Setujui mutasi stok?',
    message: mutation
      ? `Pastikan ${mutation.quantity} ${mutation.product.name} siap dikirim dari ${mutation.sourceStore.name} ke ${mutation.destinationStore.name}.`
      : 'Pastikan jumlah dan kondisi stok siap dikirim ke toko tujuan.',
    confirmLabel: 'Setujui & Kirim',
    tone: 'success',
  }
}

export function createReceiveFulfillmentConfirmation(
  order: AdminOrder,
  mutationId: number,
): FulfillmentConfirmation {
  const mutation = order.stockMutations.find((item) => item.id === mutationId)

  return {
    type: 'receive',
    mutationId,
    title: 'Barang mutasi sudah diterima?',
    message: mutation
      ? `Konfirmasi jika ${mutation.quantity} ${mutation.product.name} sudah tiba dan diperiksa di ${mutation.destinationStore.name}.`
      : 'Konfirmasi hanya jika barang sudah benar-benar tiba dan diperiksa di gudang tujuan.',
    confirmLabel: 'Terima Barang',
    tone: 'info',
  }
}
