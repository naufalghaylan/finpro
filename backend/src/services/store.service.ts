import prisma from '../lib/prisma';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { getProvincesService, getCitiesService } from './rajaongkir.service';
import { 
  createStoreRepository, 
  updateStoreRepository, 
  deleteStoreRepository, 
  getStoresRepository, 
  getStoreByIdRepository 
} from '../repositories/store.repository';
import { createStoreAdminRepository } from '../repositories/user.repository';
import { Prisma } from '../generated/prisma/client';

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getNearestStoreService = async (lat: number, lng: number) => {
  const stores = await prisma.store.findMany({
    where: { status: true }
  });

  if (!stores || stores.length === 0) {
    return null;
  }

  let nearestStore = stores[0];
  let minDistance = getDistanceFromLatLonInKm(lat, lng, nearestStore.latitude, nearestStore.longitude);

  for (let i = 1; i < stores.length; i++) {
    const store = stores[i];
    const distance = getDistanceFromLatLonInKm(lat, lng, store.latitude, store.longitude);
    if (distance < minDistance) {
      nearestStore = store;
      minDistance = distance;
    }
  }

  const isOutOfRange = minDistance > nearestStore.serviceRadius;

  return {
    ...nearestStore,
    distance: minDistance,
    isOutOfRange
  };
};

export const reverseGeocodeAndMatchRajaOngkir = async (lat: number, lng: number) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon: lng, format: 'jsonv2' },
      headers: { 'User-Agent': 'FinproGroceryApp/1.0' }
    });
    
    if (!response.data || !response.data.address) return null;
    
    const address = response.data.address;
    let cityName = address.city || address.town || address.municipality || address.county;
    let provinceName = address.state || address.province;

    if (!cityName || !provinceName) return null;

    cityName = cityName.replace(/Kota |Kabupaten |Kab\. /gi, '').trim();

    const provinces = await getProvincesService();
    const matchedProvince = provinces.find((p: any) => 
      provinceName.toLowerCase().includes(p.province.toLowerCase()) || 
      p.province.toLowerCase().includes(provinceName.toLowerCase())
    );

    if (!matchedProvince) return null;

    const cities = await getCitiesService(matchedProvince.province_id);
    const matchedCity = cities.find((c: any) => 
      c.city_name.toLowerCase() === cityName.toLowerCase() ||
      cityName.toLowerCase().includes(c.city_name.toLowerCase())
    );

    return {
      provinceId: matchedProvince.province_id,
      provinceName: matchedProvince.province,
      cityId: matchedCity?.city_id,
      cityName: matchedCity ? `${matchedCity.type} ${matchedCity.city_name}` : cityName
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

export const getStoresService = async (page: number, limit: number, search?: string, userId?: number, role?: string) => {
  const skip = (page - 1) * limit;
  const { stores, total } = await getStoresRepository(skip, limit, search, userId, role);
  return {
    stores,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getStoreByIdService = async (id: number) => {
  return await getStoreByIdRepository(id);
};

export const createStoreService = async (dataInput: Omit<Prisma.StoreCreateInput, 'slug'>) => {
  const data = { ...dataInput } as Prisma.StoreCreateInput;
  // If cityId or provinceId is missing, try to auto-resolve from lat/lng
  if (!data.cityId || !data.provinceId) {
    const geoData = await reverseGeocodeAndMatchRajaOngkir(data.latitude, data.longitude);
    if (geoData) {
      if (!data.provinceId && geoData.provinceId) data.provinceId = geoData.provinceId;
      if (!data.cityId && geoData.cityId) data.cityId = geoData.cityId;
      if (!data.province) data.province = geoData.provinceName;
      if (!data.city) data.city = geoData.cityName;
    }
  }

  // Generate slug from name
  data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  return await createStoreRepository(data);
};

export const updateStoreService = async (id: number, dataInput: Omit<Prisma.StoreUpdateInput, 'slug'>) => {
  const data = { ...dataInput } as Prisma.StoreUpdateInput;
  if (data.name && typeof data.name === 'string') {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  }
  return await updateStoreRepository(id, data);
};

export const deleteStoreService = async (id: number) => {
  return await deleteStoreRepository(id);
};

export const createStoreAdminService = async (storeId: number, data: any) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await createStoreAdminRepository({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: 'STORE_ADMIN',
    emailVerified: true,
    store: {
      connect: { id: storeId }
    }
  });
};
