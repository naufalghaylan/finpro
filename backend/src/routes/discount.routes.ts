import { Router } from 'express';
import { 
  getDiscounts, 
  createDiscount, 
  updateDiscount, 
  deleteDiscount 
} from '../controllers/discount.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getDiscounts);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), createDiscount);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), updateDiscount);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), deleteDiscount);

export default router;
