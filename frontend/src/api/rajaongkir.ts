import api from './axios';

export interface KomerceDestination {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

export const searchDestinations = async (query: string) => {
  if (!query || query.length < 3) return [];
  const response = await api.get<{ message: string; data: KomerceDestination[] }>('/shipping/destinations', {
    params: { search: query }
  });
  return response.data.data;
};

export interface ShippingCostRequest {
  addressId: number;
  storeId: number;
  weight: number;
  courier: string;
}

export interface ShippingCostResult {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export const calculateShippingCost = async (payload: ShippingCostRequest) => {
  const response = await api.post<{ message: string; data: ShippingCostResult[] }>('/shipping/cost', payload);
  return response.data.data;
};
