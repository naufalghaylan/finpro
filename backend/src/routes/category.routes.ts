import { Router } from 'express'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

// Public routes
router.get('/:categoryId/products', productController.getProductsByCategory)
router.get('/:id', productController.getCategoryById)
router.get('/', productController.getCategories)

// Admin only routes (Super Admin)
router.post('/', authenticate, authorize('SUPER_ADMIN'), productController.createCategory)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), productController.updateCategory)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), productController.deleteCategory)

export default router