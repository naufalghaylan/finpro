import { Request, Response } from 'express';
import * as homepageService from '../services/homepage.service';

export const getHomepage = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const data = await homepageService.getHomepageDataService(lat, lng);
    
    res.status(200).json({
      message: 'Homepage data fetched successfully',
      data
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
