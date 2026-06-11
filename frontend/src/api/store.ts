import api from './axios';
import type { Store, StoreInput, StoreAdminInput, PaginationMeta } from '../types/store';

interface GetStoresResponse {
  message: string;
  data: Store[];
  pagination: PaginationMeta;
}

interface GetStoreResponse {
  message: string;
  data: Store;
}

export const getStores = async (page: number = 1, limit: number = 10, search?: string) => {
  const params = { page, limit, search };
  const response = await api.get<GetStoresResponse>('/stores', { params });
  return response.data;
};

export const getPublicStores = async (page: number = 1, limit: number = 100, search?: string) => {
  const params = { page, limit, search };
  const response = await api.get<GetStoresResponse>('/stores/public', { params });
  return response.data;
};

export const getNearestStore = async (lat: number, lng: number) => {
  const params = { lat, lng };
  const response = await api.get<GetStoreResponse>('/stores/nearest', { params });
  return response.data;
};

export const getStoreById = async (id: number) => {
  const response = await api.get<GetStoreResponse>(`/stores/${id}`);
  return response.data;
};

export const createStore = async (data: StoreInput) => {
  const response = await api.post<{ message: string; data: Store }>('/stores', data);
  return response.data;
};

export const updateStore = async (id: number, data: Partial<StoreInput>) => {
  const response = await api.put<{ message: string; data: Store }>(`/stores/${id}`, data);
  return response.data;
};

export const deleteStore = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/stores/${id}`);
  return response.data;
};

export const createStoreAdmin = async (storeId: number, data: StoreAdminInput) => {
  const response = await api.post<{ message: string; data: any }>(`/stores/${storeId}/admins`, data);
  return response.data;
};
