import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const uploadDir = path.join(__dirname, '../../../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `product-${Date.now()}${ext}`)
  }
})

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif']
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXT.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Ekstensi tidak diizinkan. Gunakan .jpg, .jpeg, .png, atau .gif'))
    }
  }
})

const router = Router()

// Public routes
router.get('/search', productController.searchProducts)
router.get('/', productController.getAllProducts)

// Image routes (harus sebelum /:id)
router.delete('/images/:imageId', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), productController.deleteProductImage)
router.post('/:id/images', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), upload.single('image'), productController.uploadProductImage)

// Product by ID
router.get('/:id', productController.getProductById)

// Admin CRUD
router.post('/', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), productController.createProduct)
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), productController.updateProduct)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'STORE_ADMIN'), productController.deleteProduct)

export default router
