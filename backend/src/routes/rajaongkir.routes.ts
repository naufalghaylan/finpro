import { Router } from 'express';
import { searchDestinations, calculateShippingCost } from '../controllers/rajaongkir.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/destinations', searchDestinations);
router.post('/cost', authenticate, calculateShippingCost);

export default router;
