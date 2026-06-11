import { Router } from 'express';
import { getStoreAdmins, createStoreAdmin, assignStoreAdmin } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Only SUPER_ADMIN can manage store admins globally
router.get('/admins', authenticate, authorize('SUPER_ADMIN'), getStoreAdmins);
router.post('/admins', authenticate, authorize('SUPER_ADMIN'), createStoreAdmin);
router.put('/admins/:id/assign', authenticate, authorize('SUPER_ADMIN'), assignStoreAdmin);

export default router;
