import { Request, Response } from 'express';
import { getActivePromotionsService } from '../services/promotion.service';
import { sendNewsletterSubscriptionEmail } from '../lib/mailer';

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

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'Email tidak valid' });
      return;
    }

    await sendNewsletterSubscriptionEmail(email);

    res.status(200).json({ message: 'Berhasil berlangganan promo' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mendaftar langganan promo', error: error.message });
  }
};
