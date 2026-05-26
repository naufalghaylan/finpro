import { Router } from 'express';
import { getNearestStore } from '../controllers/store.controller';

const router = Router();

router.get('/nearest', getNearestStore);

export default router;
