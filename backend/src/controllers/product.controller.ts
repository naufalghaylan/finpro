import { Request, Response } from 'express';
import { getProductsService } from '../services/product.service';
import { productListSchema } from '../validations/product.validation';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQuery = productListSchema.parse({ query: req.query });
    const { storeId, page, limit, sort, filter } = validatedQuery.query;

    const parsedStoreId = storeId ? parseInt(storeId) : undefined;
    const parsedPage = page ? parseInt(page) : 1;
    const parsedLimit = limit ? parseInt(limit) : 10;
    
    let sortBy = 'createdAt';
    let sortOrder: 'asc' | 'desc' = 'desc';
    if (sort) {
      const parts = sort.split(':');
      if (parts.length === 2) {
        sortBy = parts[0];
        sortOrder = parts[1] === 'asc' ? 'asc' : 'desc';
      } else {
        sortBy = sort;
      }
    }

    const result = await getProductsService(
      parsedStoreId,
      parsedPage,
      parsedLimit,
      sortBy,
      sortOrder,
      filter
    );

    res.status(200).json({
      message: 'Products fetched successfully',
      ...result
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
