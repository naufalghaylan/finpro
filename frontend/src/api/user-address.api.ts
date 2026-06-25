import api from './axios';
import type { UserAddress, CreateUserAddressDTO, UpdateUserAddressDTO } from '../types/address';

export const getAddresses = async () => {
  const response = await api.get<{ message: string; data: UserAddress[] }>('/addresses');
  return response.data.data;
};

export const getAddressById = async (id: number) => {
  const response = await api.get<{ message: string; data: UserAddress }>(`/addresses/${id}`);
  return response.data.data;
};

export const createAddress = async (data: CreateUserAddressDTO) => {
  const response = await api.post<{ message: string; data: UserAddress }>('/addresses', data);
  return response.data.data;
};

export const updateAddress = async (id: number, data: UpdateUserAddressDTO) => {
  const response = await api.put<{ message: string; data: UserAddress }>(`/addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/addresses/${id}`);
  return response.data.message;
};

export const setPrimaryAddress = async (id: number) => {
  const response = await api.put<{ message: string; data: UserAddress }>(`/addresses/${id}/primary`);
  return response.data.data;
};
