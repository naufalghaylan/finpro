import { Request, Response } from 'express';
import { 
  getDiscountsService, 
  createDiscountService, 
  updateDiscountService, 
  deleteDiscountService, 
  getDiscountByIdService 
} from '../services/discount.service';
import { createDiscountSchema, updateDiscountSchema } from '../validations/discount.validation';

export const getDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    let storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;

    if (req.user?.role === 'STORE_ADMIN') {
      storeId = req.user.storeId;
    }

    const result = await getDiscountsService(storeId, page, limit);

    res.status(200).json({
      message: 'Discounts fetched successfully',
      data: result.discounts,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createDiscountSchema.parse({ body: req.body });
    const data = validatedData.body;

    if (req.user?.role === 'STORE_ADMIN') {
      data.storeId = req.user.storeId;
    }

    if (!data.storeId) {
      res.status(400).json({ message: 'storeId is required' });
      return;
    }

    // Prisma conversion for Date strings
    const payload = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      storeId: data.storeId
    };

    const discount = await createDiscountService(payload);

    res.status(201).json({
      message: 'Discount created successfully',
      data: discount
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const existingDiscount = await getDiscountByIdService(id);

    if (!existingDiscount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    if (req.user?.role === 'STORE_ADMIN' && existingDiscount.storeId !== req.user.storeId) {
      res.status(403).json({ message: 'Forbidden: You can only update your own store discount' });
      return;
    }

    const validatedData = updateDiscountSchema.parse({ body: req.body });
    const data = validatedData.body;

    const payload: any = { ...data };
    if (data.startDate) payload.startDate = new Date(data.startDate);
    if (data.endDate) payload.endDate = new Date(data.endDate);

    const discount = await updateDiscountService(id, payload);

    res.status(200).json({
      message: 'Discount updated successfully',
      data: discount
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const existingDiscount = await getDiscountByIdService(id);

    if (!existingDiscount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    if (req.user?.role === 'STORE_ADMIN' && existingDiscount.storeId !== req.user.storeId) {
      res.status(403).json({ message: 'Forbidden: You can only delete your own store discount' });
      return;
    }

    await deleteDiscountService(id);

    res.status(200).json({
      message: 'Discount deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
