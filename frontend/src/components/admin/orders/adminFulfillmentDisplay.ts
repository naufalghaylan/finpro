import type { MutationStatus } from '../../../types/order'

export const mutationStatusLabel: Record<MutationStatus, string> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  IN_TRANSIT: 'Dalam Perjalanan',
  COMPLETED: 'Diterima',
  REJECTED: 'Ditolak',
}

export const mutationStatusClass: Record<MutationStatus, string> = {
  PENDING: 'bg-admin-amber-soft text-admin-amber',
  APPROVED: 'bg-admin-blue-soft text-admin-blue',
  IN_TRANSIT: 'bg-admin-blue-soft text-admin-blue',
  COMPLETED: 'bg-admin-green-soft text-admin-green',
  REJECTED: 'bg-admin-red-soft text-admin-red',
}
