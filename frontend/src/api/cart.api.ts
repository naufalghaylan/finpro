import api from './axios'
import type { ApiData } from './api.types'
import type { Cart, CartMutationResult } from '../types/cart'

export type CartContext = {
  lat?: number
  lng?: number
  storeId?: number
}

export async function getCart(context?: CartContext | null): Promise<Cart> {
  const params = context ?? undefined
  const { data } = await api.get<ApiData<Cart>>('/cart', { params })
  return data.data
}

export async function addCartItem(productId: number, quantity = 1, storeId?: number): Promise<CartMutationResult> {
  const { data } = await api.post<ApiData<CartMutationResult>>('/cart/items', { productId, quantity, storeId })
  return data.data
}

export async function updateCartItem(itemId: number, quantity: number, storeId?: number): Promise<CartMutationResult> {
  const { data } = await api.patch<ApiData<CartMutationResult>>(`/cart/items/${itemId}`, { quantity, storeId })
  return data.data
}

export async function deleteCartItem(itemId: number): Promise<CartMutationResult> {
  const { data } = await api.delete<ApiData<CartMutationResult>>(`/cart/items/${itemId}`)
  return data.data
}
