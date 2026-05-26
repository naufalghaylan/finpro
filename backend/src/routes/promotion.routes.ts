import { Router } from 'express';
import { getPromotions } from '../controllers/promotion.controller';

const router = Router();

router.get('/', getPromotions);

export default router;
