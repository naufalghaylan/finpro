import { Router } from 'express';
import { getPromotions, subscribeNewsletter } from '../controllers/promotion.controller';

const router = Router();

router.get('/', getPromotions);
router.post('/subscribe', subscribeNewsletter);

export default router;
