import { Router } from 'express';
import { getHomepage } from '../controllers/homepage.controller';
import { validateQuery } from '../middlewares/validation.middleware';
import { getHomepageQuerySchema } from '../validations/homepage.validation';

const router = Router();

router.get('/', validateQuery(getHomepageQuerySchema), getHomepage);

export default router;
