import api from './axios'
import type { ApiData } from './api.types'
import type {
  CheckoutPreview,
  CreateCheckoutOrderPayload,
  CreateCheckoutOrderResult,
  CreateMidtransPaymentResult,
  CheckoutOrder,
} from '../types/order'

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

export async function createMidtransPayment(orderId: number): Promise<CreateMidtransPaymentResult> {
  const { data } = await api.post<ApiData<CreateMidtransPaymentResult>>(`/orders/${orderId}/payment-gateway`)

  return data.data
}

export async function syncMidtransPaymentStatus(orderId: number): Promise<CheckoutOrder> {
  const { data } = await api.post<ApiData<CheckoutOrder>>(`/orders/${orderId}/payment-gateway/sync`)

  return data.data
}
