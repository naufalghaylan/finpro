import axios from 'axios';
import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || '';
const RAJAONGKIR_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

const apiClient = axios.create({
  baseURL: RAJAONGKIR_BASE_URL,
  headers: {
    key: RAJAONGKIR_API_KEY,
  },
});

export const searchDestinationsService = async (query: string) => {
  try {
    const response = await apiClient.get('/destination/domestic-destination', {
      params: { search: query }
    });
    return response.data.data || [];
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw new Error(`Failed to search destinations: ${error instanceof Error ? error.message : String(error)}`);
  }
};

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

  // 3. Hit RajaOngkir API (Komerce V2 uses urlencoded)
  try {
    const response = await apiClient.post('/calculate/domestic-cost', {
      origin: store.cityId,
      destination: address.cityId,
      weight: weight,
      courier: courier
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    // Komerce V2 returns results in .data
    const results = response.data.data

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
