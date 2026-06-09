import api from './axios'
import type {
  CheckoutPreview,
  CreateCheckoutOrderPayload,
  CreateCheckoutOrderResult,
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
