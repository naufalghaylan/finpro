import { Request, Response } from 'express';
import { 
  getNearestStoreService, 
  getStoresService, 
  getStoreByIdService, 
  createStoreService, 
  updateStoreService, 
  deleteStoreService, 
  createStoreAdminService 
} from '../services/store.service';
import { 
  nearestStoreSchema, 
  createStoreSchema, 
  updateStoreSchema, 
  createStoreAdminSchema 
} from '../validations/store.validation';
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

export const getStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const result = await getStoresService(page, limit, search, userId, role);

    res.status(200).json({
      message: 'Stores fetched successfully',
      data: result.stores,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getStoreById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const userId = req.user?.userId;
    const role = req.user?.role;
    const userStoreId = req.user?.storeId;

    if (role === 'STORE_ADMIN' && userStoreId !== id) {
      res.status(403).json({ message: 'Forbidden: You can only access your own store' });
      return;
    }

    const store = await getStoreByIdService(id);

    if (!store) {
      res.status(404).json({ message: 'Store not found' });
      return;
    }

    res.status(200).json({
      message: 'Store fetched successfully',
      data: store
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createStoreSchema.parse({ body: req.body });
    const store = await createStoreService(validatedData.body);

    res.status(201).json({
      message: 'Store created successfully',
      data: store
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const role = req.user?.role;
    const userStoreId = req.user?.storeId;

    if (role === 'STORE_ADMIN' && userStoreId !== id) {
      res.status(403).json({ message: 'Forbidden: You can only update your own store' });
      return;
    }

    const validatedData = updateStoreSchema.parse({ body: req.body });
    const store = await updateStoreService(id, validatedData.body);

    res.status(200).json({
      message: 'Store updated successfully',
      data: store
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await deleteStoreService(id);

    res.status(200).json({
      message: 'Store deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = parseInt(req.params.id as string);
    const validatedData = createStoreAdminSchema.parse({ body: req.body });
    const admin = await createStoreAdminService(storeId, validatedData.body);

    res.status(201).json({
      message: 'Store admin created successfully',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
      return;
    }
    if (error.message === 'Email already registered') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
