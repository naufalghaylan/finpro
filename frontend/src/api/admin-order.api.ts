import api from './axios'
import type { ApiData, ApiListData } from './api.types'
import type {
  AdminOrder,
  AdminOrderListQuery,
  AdminOrderListResponse,
} from '../types/order'

export async function getAdminOrders(params?: AdminOrderListQuery): Promise<AdminOrderListResponse> {
  const { data } = await api.get<ApiListData<AdminOrder[]>>('/orders/admin', {
    params,
  })

  return {
    orders: data.data,
    meta: data.meta,
  }
}

export async function confirmManualPayment(
  orderId: number,
  action: 'approve' | 'reject',
): Promise<AdminOrder> {
  const { data } = await api.post<ApiData<AdminOrder>>(`/orders/admin/${orderId}/confirm-payment`, {
    action,
  })

  return data.data
}

export async function adminCancelOrder(orderId: number, reason?: string): Promise<AdminOrder> {
  const { data } = await api.post<ApiData<AdminOrder>>(`/orders/admin/${orderId}/cancel`, {
    reason: reason?.trim() || undefined,
  })

  return data.data
}

export async function shipAdminOrder(orderId: number): Promise<AdminOrder> {
  const { data } = await api.post<ApiData<AdminOrder>>(`/orders/admin/${orderId}/ship`)

  return data.data
}
