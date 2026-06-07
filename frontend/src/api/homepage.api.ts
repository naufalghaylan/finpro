import api from './axios';
import type { HomepageResponse } from '../types/home/homepage';

interface HomepageParams {
  lat?: number;
  lng?: number;
}

export const getHomepageData = async (lat?: number, lng?: number): Promise<HomepageResponse> => {
  const params: HomepageParams = {};
  if (lat !== undefined && lng !== undefined) {
    params.lat = lat;
    params.lng = lng;
  }
  
  const response = await api.get<HomepageResponse>('/api/homepage', { params });
  return response.data;
};

// TODO: tidak perlu implement endpoint homepage, kalau di homepagenya pakai endpoint products dan store aja
// TODO: semua yang any diganti dengan tipe yang sesuai, misal kalau params buat bentuk paramsnya, kalau response buat bentuk response dari endpointnya, dll. Jangan sampai ada any di codebase kita, karena itu bisa bikin error yang sulit dilacak dan bikin code kita jadi kurang aman. 
// TODO: Semua yang any dibikin type yang sesuai dulu, misal kalau params buat bentuk paramsnya, kalau response buat bentuk response dari endpointnya, dll. Jangan sampai ada any di codebase kita, karena itu bisa bikin error yang sulit dilacak dan bikin code kita jadi kurang aman.