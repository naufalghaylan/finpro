import api from './axios';

export interface RajaOngkirProvince {
  province_id: string;
  province: string;
}

export interface RajaOngkirCity {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
}

export const getProvinces = async () => {
  const response = await api.get<{ message: string; data: RajaOngkirProvince[] }>('/shipping/provinces');
  return response.data.data;
};

export const getCities = async (provinceId?: string) => {
  const params = provinceId ? { provinceId } : {};
  const response = await api.get<{ message: string; data: RajaOngkirCity[] }>('/shipping/cities', { params });
  return response.data.data;
};
