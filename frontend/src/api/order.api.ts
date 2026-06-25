import api from './axios'
import type { ApiData, ApiListData } from './api.types'
import type {
  AdminOrder,
  AdminOrderListQuery,
  AdminOrderListResponse,
  CheckoutOrder,
  CheckoutPreview,
  CreateCheckoutOrderPayload,
  CreateCheckoutOrderResult,
  CreateMidtransPaymentResult,
  OrderFulfillmentMutation,
  OrderListQuery,
  OrderListResponse,
  StoreFulfillmentListQuery,
  StoreFulfillmentListResponse,
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

export async function getAdminOrders(params?: AdminOrderListQuery): Promise<AdminOrderListResponse> {
  const { data } = await api.get<ApiListData<AdminOrder[]>>('/orders/admin', {
    params,
  })

  return {
    orders: data.data,
    meta: data.meta,
  }
}

export async function getCheckoutPreview(addressId?: number): Promise<CheckoutPreview> {
  const { data } = await api.get<ApiData<CheckoutPreview>>('/orders/checkout', {
    params: addressId ? { addressId } : undefined,
  })

  return data.data
}

export async function createCheckoutOrder(
  payload: CreateCheckoutOrderPayload,
): Promise<CreateCheckoutOrderResult> {
  const { data } = await api.post<ApiData<CreateCheckoutOrderResult>>('/orders/checkout', payload)

  return data.data
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

export async function createMidtransPayment(orderId: number): Promise<CreateMidtransPaymentResult> {
  const { data } = await api.post<ApiData<CreateMidtransPaymentResult>>(`/orders/${orderId}/payment-gateway`)

  return data.data
}

export async function syncMidtransPaymentStatus(orderId: number): Promise<CheckoutOrder> {
  const { data } = await api.post<ApiData<CheckoutOrder>>(`/orders/${orderId}/payment-gateway/sync`)

  return data.data
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
