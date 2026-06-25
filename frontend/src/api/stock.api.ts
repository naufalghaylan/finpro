import api from './axios'
import type { MutationStatus, OrderStatus } from '../types/order'

export interface Stock {
  id: number
  productId: number
  storeId: number
  quantity: number
  product: {
    id: number
    name: string
    images?: Array<{ imageUrl: string; isPrimary: boolean }>
    category?: { id: number; name: string }
  }
  store?: {
    name: string
  }
}

export type StockJournalType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'ORDER'
  | 'CANCEL_RETURN'
  | 'MUTATION_IN'
  | 'MUTATION_OUT'

export interface StockJournal {
  id: number
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  type: StockJournalType
  description?: string | null
  notes?: string | null
  createdAt: string
  creator: { id: number; name: string; email: string }
  order?: { id: number; orderNumber: string; status: OrderStatus } | null
  stockMutation?: {
    id: number
    quantity: number
    status: MutationStatus
    sourceStore: { id: number; name: string }
    destinationStore: { id: number; name: string }
  } | null
}

export interface StockDetail extends Stock {
  journals: StockJournal[]
  store: { id: number; name: string }
}

export const getStocks = async (storeId?: number, page: number = 1, limit: number = 10, search?: string) => {
  const params = { storeId, page, limit, search }
  const response = await api.get<{ message: string; data: Stock[]; pagination: any }>('/stocks', { params })
  return response.data
}

export const getStockById = async (id: number) => {
  const response = await api.get<{ message: string; data: StockDetail }>(`/stocks/${id}`)
  return response.data
}

export const adjustStock = async (id: number, data: { quantityChange: number; notes?: string }) => {
  const response = await api.post<{ message: string; data: Stock }>(`/stocks/${id}/adjust`, data)
  return response.data
}

export const addStock = async (data: { storeId: number; productId: number; quantity: number; notes?: string }) => {
  const response = await api.post<{ message: string; data: Stock }>('/stocks', data);
  return response.data;
};

export const deleteStock = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/stocks/${id}`);
  return response.data;
};
