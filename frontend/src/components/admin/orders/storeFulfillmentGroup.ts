import type { MutationStatus, OrderFulfillmentMutation } from '../../../types/order'

export type FulfillmentAction = 'approve' | 'receive' | 'reject'

export type StoreFulfillmentGroup = {
  key: string
  orderId: number | null
  orderNumber: string
  sourceStore: OrderFulfillmentMutation['sourceStore']
  destinationStore: OrderFulfillmentMutation['destinationStore']
  createdAt: string
  mutations: OrderFulfillmentMutation[]
}

export type GroupStatus = MutationStatus | 'MIXED'

export const mutationStatusDisplay: Record<MutationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Menunggu persetujuan', className: 'bg-admin-amber-soft text-admin-amber' },
  APPROVED: { label: 'Disetujui', className: 'bg-admin-blue-soft text-admin-blue' },
  IN_TRANSIT: { label: 'Dalam perjalanan', className: 'bg-admin-blue-soft text-admin-blue' },
  COMPLETED: { label: 'Sudah diterima', className: 'bg-admin-green-soft text-admin-green' },
  REJECTED: { label: 'Ditolak', className: 'bg-admin-red-soft text-admin-red' },
}

export const groupStatusDisplay: Record<GroupStatus, { label: string; className: string }> = {
  ...mutationStatusDisplay,
  MIXED: { label: 'Status campuran', className: 'bg-admin-surface-2 text-admin-ink-soft' },
}

export const groupStoreFulfillments = (
  fulfillments: OrderFulfillmentMutation[],
): StoreFulfillmentGroup[] => {
  const groups = new Map<string, StoreFulfillmentGroup>()

  for (const mutation of fulfillments) {
    const key = mutation.orderId
      ? `${mutation.orderId}:${mutation.sourceStoreId}:${mutation.destinationStoreId}`
      : `mutation:${mutation.id}`
    const currentGroup = groups.get(key)

    if (currentGroup) {
      currentGroup.mutations.push(mutation)
      continue
    }

    groups.set(key, {
      key,
      orderId: mutation.orderId,
      orderNumber: mutation.order?.orderNumber ?? 'Mutasi stok umum',
      sourceStore: mutation.sourceStore,
      destinationStore: mutation.destinationStore,
      createdAt: mutation.createdAt,
      mutations: [mutation],
    })
  }

  return [...groups.values()]
}

export const getGroupStatus = (mutations: OrderFulfillmentMutation[]): GroupStatus => {
  const statuses = new Set(mutations.map((mutation) => mutation.status))
  return statuses.size === 1 ? mutations[0].status : 'MIXED'
}
