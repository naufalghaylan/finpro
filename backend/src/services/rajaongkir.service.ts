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

import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'

export const calculateShippingCostService = async (userId: number, addressId: number, storeId: number, weight: number, courier: string) => {
  // 1. Check if cached
  const cached = await prisma.userShippingCache.findUnique({
    where: {
      userId_addressId_storeId_weight_courier: {
        userId,
        addressId,
        storeId,
        weight,
        courier
      }
    }
  })

  if (cached) {
    return cached.results
  }

  // 2. Not cached, get address and store
  const address = await prisma.userAddress.findFirst({
    where: { id: addressId, userId, deletedAt: null }
  })
  if (!address || !address.cityId) {
    throw new AppError(400, 'Invalid address or missing city data')
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId, deletedAt: null }
  })
  if (!store || !store.cityId) {
    throw new AppError(400, 'Invalid store or missing city data')
  }

  // 3. Hit RajaOngkir API
  try {
    const response = await apiClient.post('/cost', {
      origin: store.cityId,
      destination: address.cityId,
      weight: weight,
      courier: courier
    })
    
    const results = response.data.rajaongkir.results

    // 4. Cache the results
    await prisma.userShippingCache.create({
      data: {
        userId,
        addressId,
        storeId,
        weight,
        courier,
        results: results as any
      }
    })

    return results
  } catch (error: unknown) {
    throw new AppError(500, `Failed to calculate shipping cost: ${error instanceof Error ? error.message : String(error)}`)
  }
}
