import { Router } from 'express';
import { getProvinces, getCities } from '../controllers/rajaongkir.controller';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/cities', getCities);

export default router;
