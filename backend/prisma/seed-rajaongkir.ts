import prisma from '../src/lib/prisma';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || '';
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

const apiClient = axios.create({
  baseURL: RAJAONGKIR_BASE_URL,
  headers: {
    key: RAJAONGKIR_API_KEY,
  },
});

async function seedProvinces() {
  console.log('Fetching provinces from RajaOngkir...');
  const response = await apiClient.get('/province');
  const provinces = response.data.rajaongkir.results;

  console.log(`Saving ${provinces.length} provinces to database...`);
  
  for (const province of provinces) {
    await prisma.province.upsert({
      where: { id: province.province_id },
      update: { provinceName: province.province },
      create: {
        id: province.province_id,
        provinceName: province.province,
      },
    });
  }
  console.log('Provinces saved successfully!');
}

async function seedCities() {
  console.log('Fetching cities from RajaOngkir...');
  const response = await apiClient.get('/city');
  const cities = response.data.rajaongkir.results;

  console.log(`Saving ${cities.length} cities to database...`);

  for (const city of cities) {
    await prisma.city.upsert({
      where: { id: city.city_id },
      update: {
        provinceId: city.province_id,
        provinceName: city.province,
        type: city.type,
        cityName: city.city_name,
        postalCode: city.postal_code,
      },
      create: {
        id: city.city_id,
        provinceId: city.province_id,
        provinceName: city.province,
        type: city.type,
        cityName: city.city_name,
        postalCode: city.postal_code,
      },
    });
  }
  console.log('Cities saved successfully!');
}

async function main() {
  try {
    if (!RAJAONGKIR_API_KEY) {
      throw new Error('RAJAONGKIR_API_KEY is missing in .env file');
    }

    await seedProvinces();
    await seedCities();
    
    console.log('🎉 RajaOngkir seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Failed to seed RajaOngkir data:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message || error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
