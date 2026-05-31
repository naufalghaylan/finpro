import { Request, Response } from 'express';
import { getNearestStoreService } from '../services/store.service';
import { nearestStoreSchema } from '../validations/store.validation';

export const getNearestStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQuery = nearestStoreSchema.parse({ query: req.query });
    const { lat, lng } = validatedQuery.query;

    const nearestStore = await getNearestStoreService(parseFloat(lat), parseFloat(lng));

    if (!nearestStore) {
      res.status(404).json({ message: 'No stores available' });
      return;
    }

    res.status(200).json({
      message: 'Nearest store fetched successfully',
      data: nearestStore
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
