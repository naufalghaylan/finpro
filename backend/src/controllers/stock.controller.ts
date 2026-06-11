import { Request, Response } from 'express';
import { getStocksService, getStockByIdService, adjustStockService, addStockService } from '../services/stock.service';
import { adjustStockSchema, addStockSchema } from '../validations/stock.validation';

export const getStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;

    // Security check: if STORE_ADMIN, ensure they can only view their own store's stocks
    if (req.user?.role === 'STORE_ADMIN') {
      if (!storeId || storeId !== req.user.storeId) {
        res.status(403).json({ message: 'Forbidden: You can only view stocks of your own store' });
        return;
      }
    }

    const result = await getStocksService(storeId, search, page, limit);

    res.status(200).json({
      message: 'Stocks fetched successfully',
      data: result.stocks,
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

export const getStockById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const stock = await getStockByIdService(id);

    if (!stock) {
      res.status(404).json({ message: 'Stock not found' });
      return;
    }

    if (req.user?.role === 'STORE_ADMIN' && stock.storeId !== req.user.storeId) {
      res.status(403).json({ message: 'Forbidden: You can only view stocks of your own store' });
      return;
    }

    res.status(200).json({
      message: 'Stock fetched successfully',
      data: stock
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const userId = req.user!.userId;

    const stock = await getStockByIdService(id);
    if (!stock) {
      res.status(404).json({ message: 'Stock not found' });
      return;
    }

    if (req.user?.role === 'STORE_ADMIN' && stock.storeId !== req.user.storeId) {
      res.status(403).json({ message: 'Forbidden: You can only adjust stocks of your own store' });
      return;
    }

    const validatedData = adjustStockSchema.parse({ body: req.body });
    const updatedStock = await adjustStockService(id, validatedData.body.quantityChange, validatedData.body.notes, userId);

    res.status(200).json({
      message: 'Stock adjusted successfully',
      data: updatedStock
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    if (error.message === 'Stock cannot be negative') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const addStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const validatedData = addStockSchema.parse({ body: req.body });
    const { productId, storeId, quantity, notes } = validatedData.body;

    if (req.user?.role === 'STORE_ADMIN' && storeId !== req.user.storeId) {
      res.status(403).json({ message: 'Forbidden: You can only add stocks to your own store' });
      return;
    }

    const newStock = await addStockService(productId, storeId, quantity, notes, userId);

    res.status(201).json({
      message: 'Stock added successfully',
      data: newStock
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    if (error.message === 'Stock already exists for this product in this store') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
