import api from './axios'
import type { ApiData, ApiListData } from './api.types'
import type {
  CheckoutOrder,
  OrderListQuery,
  OrderListResponse,
} from '../types/order'

export async function getOrders(params?: OrderListQuery): Promise<OrderListResponse> {
  const { data } = await api.get<ApiListData<CheckoutOrder[]>>('/orders', {
    params,
  })

  return {
    orders: data.data,
    meta: data.meta,
  }
}

export async function getOrderDetails(orderId: number): Promise<CheckoutOrder> {
  const { data } = await api.get<ApiData<CheckoutOrder>>(`/orders/${orderId}`)

  return data.data
}

export const getOrderPaymentDetails = getOrderDetails

export async function uploadManualPaymentProof(orderId: number, file: File): Promise<CheckoutOrder> {
  const formData = new FormData()
  formData.append('paymentProof', file)

  const { data } = await api.post<ApiData<CheckoutOrder>>(`/orders/${orderId}/payment-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data.data
}

export async function cancelOrder(orderId: number, reason?: string): Promise<CheckoutOrder> {
  const { data } = await api.post<ApiData<CheckoutOrder>>(`/orders/${orderId}/cancel`, {
    reason: reason?.trim() || undefined,
  })

  return data.data
}

export async function confirmOrderReceived(orderId: number): Promise<CheckoutOrder> {
  const { data } = await api.post<ApiData<CheckoutOrder>>(`/orders/${orderId}/confirm`)

  return data.data
}
