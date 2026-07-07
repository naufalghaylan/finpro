import { getStores } from '../../api/store'
import type { OrderListMeta } from '../../types/order'
import type { Store } from '../../types/store'

export const PAGE_LIMIT = 10

export type PaymentConfirmationAction = 'approve' | 'reject'

export const emptyMeta: OrderListMeta = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

export const loadAdminOrderStores = async (): Promise<Store[]> => {
  try {
    const response = await getStores(1, 100)
    return response.data
  } catch {
    return []
  }
}