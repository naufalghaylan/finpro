import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { createStoreAdminSchema, assignStoreAdminSchema } from '../validations/user.validation';

export const getStoreAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await UserService.getStoreAdmins();
    res.status(200).json({
      message: 'Admins fetched successfully',
      data: admins
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const createStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createStoreAdminSchema.parse({ body: req.body });
    const admin = await UserService.createStoreAdmin(validatedData.body);

    res.status(201).json({
      message: 'Admin created successfully',
      data: admin
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const assignStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id as string);
    const validatedData = assignStoreAdminSchema.parse({ body: req.body });
    
    const admin = await UserService.assignStoreAdmin(adminId, validatedData.body.storeId);

    res.status(200).json({
      message: 'Admin assigned successfully',
      data: admin
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};
