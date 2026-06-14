import { Request, Response } from 'express';
import { searchDestinationsService } from '../services/rajaongkir.service';

export const searchDestinations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    if (!search || typeof search !== 'string') {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }
    const destinations = await searchDestinationsService(search);
    res.status(200).json({
      message: 'Destinations fetched successfully',
      data: destinations,
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
