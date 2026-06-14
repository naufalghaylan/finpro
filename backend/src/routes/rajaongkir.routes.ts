import { Router } from 'express';
import { getProvinces, getCities, calculateShippingCost } from '../controllers/rajaongkir.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/cities', getCities);
router.post('/cost', authenticate, calculateShippingCost);

export default router;
