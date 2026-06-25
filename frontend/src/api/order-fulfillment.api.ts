import api from './axios'
import type { ApiData, ApiListData } from './api.types'
import type {
  OrderFulfillmentMutation,
  StoreFulfillmentListQuery,
  StoreFulfillmentListResponse,
} from '../types/order'

export async function requestOrderFulfillment(
  orderId: number,
  payload: {
    sourceStoreId: number
    productId: number
    quantity: number
    notes?: string
  },
): Promise<OrderFulfillmentMutation> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation>>(
    `/orders/admin/${orderId}/fulfillments`,
    payload,
  )

  return data.data
}

export async function requestOrderFulfillments(
  orderId: number,
  requests: {
    sourceStoreId: number
    productId: number
    quantity: number
    notes?: string
  }[],
): Promise<OrderFulfillmentMutation[]> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation[]>>(
    `/orders/admin/${orderId}/fulfillments/batch`,
    { requests },
  )

  return data.data
}

export async function getStoreFulfillments(
  params: StoreFulfillmentListQuery,
): Promise<StoreFulfillmentListResponse> {
  const { data } = await api.get<ApiListData<OrderFulfillmentMutation[]>>(
    '/orders/admin/fulfillments',
    { params },
  )

  return {
    fulfillments: data.data,
    meta: data.meta,
  }
}

export async function approveOrderFulfillment(
  mutationId: number,
  notes?: string,
  confirmStockReady = false,
  approvedQuantity?: number,
): Promise<OrderFulfillmentMutation> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation>>(
    `/orders/admin/fulfillments/${mutationId}/approve`,
    { notes: notes?.trim() || undefined, confirmStockReady, approvedQuantity },
  )

  return data.data
}

export async function approveOrderFulfillments(
  mutationIds: number[],
  notes?: string,
  confirmStockReady = false,
): Promise<OrderFulfillmentMutation[]> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation[]>>(
    '/orders/admin/fulfillments/batch/approve',
    { mutationIds, notes: notes?.trim() || undefined, confirmStockReady },
  )

  return data.data
}

export async function receiveOrderFulfillment(
  mutationId: number,
  notes?: string,
  confirmPhysicalReceipt = false,
): Promise<OrderFulfillmentMutation> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation>>(
    `/orders/admin/fulfillments/${mutationId}/receive`,
    { notes: notes?.trim() || undefined, confirmPhysicalReceipt },
  )

  return data.data
}

export async function receiveOrderFulfillments(
  mutationIds: number[],
  notes?: string,
  confirmPhysicalReceipt = false,
): Promise<OrderFulfillmentMutation[]> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation[]>>(
    '/orders/admin/fulfillments/batch/receive',
    { mutationIds, notes: notes?.trim() || undefined, confirmPhysicalReceipt },
  )

  return data.data
}

export async function rejectOrderFulfillment(
  mutationId: number,
  notes?: string,
): Promise<OrderFulfillmentMutation> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation>>(
    `/orders/admin/fulfillments/${mutationId}/reject`,
    { notes: notes?.trim() || undefined },
  )

  return data.data
}

export async function rejectOrderFulfillments(
  mutationIds: number[],
  notes?: string,
): Promise<OrderFulfillmentMutation[]> {
  const { data } = await api.post<ApiData<OrderFulfillmentMutation[]>>(
    '/orders/admin/fulfillments/batch/reject',
    { mutationIds, notes: notes?.trim() || undefined },
  )

  return data.data
}
