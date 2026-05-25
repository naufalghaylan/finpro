import { Request, Response } from 'express';
import { getActivePromotionsService } from '../services/promotion.service';

export const getPromotions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const promotions = await getActivePromotionsService();

    res.status(200).json({
      message: 'Promotions fetched successfully',
      data: promotions
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
