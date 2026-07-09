import api from './axios'
import type { ApiData } from './api.types'
import type { Cart, CartMutationResult } from '../types/cart'

type CartCoords = { lat: number; lng: number }

export async function getCart(coords?: CartCoords | null): Promise<Cart> {
  const params = coords ? { lat: coords.lat, lng: coords.lng } : undefined
  const { data } = await api.get<ApiData<Cart>>('/cart', { params })
  return data.data
}

export async function addCartItem(productId: number, quantity = 1): Promise<CartMutationResult> {
  const { data } = await api.post<ApiData<CartMutationResult>>('/cart/items', { productId, quantity })
  return data.data
}

export async function updateCartItem(itemId: number, quantity: number): Promise<CartMutationResult> {
  const { data } = await api.patch<ApiData<CartMutationResult>>(`/cart/items/${itemId}`, { quantity })
  return data.data
}

export async function deleteCartItem(itemId: number): Promise<CartMutationResult> {
  const { data } = await api.delete<ApiData<CartMutationResult>>(`/cart/items/${itemId}`)
  return data.data
}
