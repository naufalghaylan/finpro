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
