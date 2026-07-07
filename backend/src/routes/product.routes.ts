import { Router } from 'express'
import multer from 'multer'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

// Simpan file di memori (buffer) lalu di-upload ke Cloudinary di controller —
// tidak ada file yang ditulis ke disk server.
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
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
// Store admin hanya boleh melihat produk (read only) → tulis khusus SUPER_ADMIN.
router.delete('/images/:imageId', authenticate, authorize('SUPER_ADMIN'), productController.deleteProductImage)
router.post('/:id/images', authenticate, authorize('SUPER_ADMIN'), upload.single('image'), productController.uploadProductImage)

// Product by ID
router.get('/:id', productController.getProductById)

// Admin CRUD (khusus SUPER_ADMIN — store admin read only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), productController.createProduct)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), productController.updateProduct)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), productController.deleteProduct)

export default router
