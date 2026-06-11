import { Router } from 'express';
import { 
  getNearestStore,
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  createStoreAdmin
} from '../controllers/store.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/nearest', getNearestStore);
router.get('/public', getStores);


// Super Admin Routes
router.get('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getStores);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getStoreById);
router.post('/', authenticate, authorize('SUPER_ADMIN'), createStore);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), updateStore);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deleteStore);
router.post('/:id/admins', authenticate, authorize('SUPER_ADMIN'), createStoreAdmin);

export default router;
