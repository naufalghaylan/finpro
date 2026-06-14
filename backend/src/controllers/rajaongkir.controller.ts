import { Request, Response } from 'express';
import { getProvincesService, getCitiesService } from '../services/rajaongkir.service';

export const getProvinces = async (req: Request, res: Response): Promise<void> => {
  try {
    const provinces = await getProvincesService();
    res.status(200).json({
      message: 'Provinces fetched successfully',
      data: provinces,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provinceId } = req.query;
    const cities = await getCitiesService(provinceId as string | undefined);
    res.status(200).json({
      message: 'Cities fetched successfully',
      data: cities,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
  }
};

import { calculateShippingCostSchema } from '../validations/rajaongkir.validation'
import { calculateShippingCostService } from '../services/rajaongkir.service'
import { AppError } from '../utils/AppError'

export const calculateShippingCost = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = calculateShippingCostSchema.parse(req.body)
    const cost = await calculateShippingCostService(
      req.user!.userId,
      parsed.addressId,
      parsed.storeId,
      parsed.weight,
      parsed.courier
    )
    res.status(200).json({
      message: 'Shipping cost calculated successfully',
      data: cost,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation failed', errors: JSON.parse(error.message) })
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
  }
}
