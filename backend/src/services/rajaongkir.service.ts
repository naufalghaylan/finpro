import axios from 'axios';

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || '';
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

const apiClient = axios.create({
  baseURL: RAJAONGKIR_BASE_URL,
  headers: {
    key: RAJAONGKIR_API_KEY,
  },
});

export const getProvincesService = async () => {
  try {
    const response = await apiClient.get('/province');
    return response.data.rajaongkir.results;
  } catch (error: unknown) {
    throw new Error(`Failed to fetch provinces: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCitiesService = async (provinceId?: string) => {
  try {
    const params = provinceId ? { province: provinceId } : {};
    const response = await apiClient.get('/city', { params });
    return response.data.rajaongkir.results;
  } catch (error: unknown) {
    throw new Error(`Failed to fetch cities: ${error instanceof Error ? error.message : String(error)}`);
  }
};
