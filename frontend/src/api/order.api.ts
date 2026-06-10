import api from './axios'
import type {
  CheckoutOrder,
  CheckoutPreview,
  CreateCheckoutOrderPayload,
  CreateCheckoutOrderResult,
  CreateMidtransPaymentResult,
} from '../types/order'

type ApiData<T> = {
  data: T
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

export async function getOrderPaymentDetails(orderId: number): Promise<CheckoutOrder> {
  const { data } = await api.get<ApiData<CheckoutOrder>>(`/orders/${orderId}/payment`)

  return data.data
}

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
