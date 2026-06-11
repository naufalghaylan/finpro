import api from './axios';

export interface Discount {
  id: number;
  storeId: number;
  productId: number | null;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'NOMINAL' | 'BUY_ONE_GET_ONE';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  product?: { id: number; name: string };
}

export const getDiscounts = async (storeId: number, page: number = 1, limit: number = 10) => {
  const params = { storeId, page, limit };
  const response = await api.get<{ message: string; data: Discount[]; pagination: any }>('/discounts', { params });
  return response.data;
};

export const createDiscount = async (data: any) => {
  const response = await api.post<{ message: string; data: Discount }>('/discounts', data);
  return response.data;
};

export const updateDiscount = async (id: number, data: any) => {
  const response = await api.put<{ message: string; data: Discount }>(`/discounts/${id}`, data);
  return response.data;
};

export const deleteDiscount = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/discounts/${id}`);
  return response.data;
};
