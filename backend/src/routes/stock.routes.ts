import { Router } from 'express';
import { 
  getStocks, 
  getStockById, 
  adjustStock,
  addStock
} from '../controllers/stock.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getStocks);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), addStock);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), getStockById);
router.post('/:id/adjust', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), adjustStock);

export default router;
