import { Router } from 'express'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

// Public routes
router.get('/search', productController.searchProducts)
router.get('/:id', productController.getProductById)
router.get('/', productController.getAllProducts)

// Admin only routes (Super Admin)
router.post('/', authenticate, authorize('SUPER_ADMIN'), productController.createProduct)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), productController.updateProduct)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), productController.deleteProduct)

export default router