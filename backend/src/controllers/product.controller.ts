import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import * as productService from '../lib/product.service'
import { z } from 'zod'
import 'multer'


const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  image: z.string().optional(),
  categoryId: z.number(),
  basePrice: z.number().positive('Harga harus lebih dari 0'),
})

const updateProductSchema = createProductSchema.partial()

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  icon: z.string().optional(),
  description: z.string().optional(),
})

const updateCategorySchema = createCategorySchema.partial()

export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      categoryId,
      minPrice,
      maxPrice,
      storeId,
      limit = 20,
      offset = 0,
      sortBy = 'newest'
    } = req.query

    const filters = {
      categoryId: categoryId ? parseInt(String(categoryId)) : undefined,
      minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
      maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      storeId: storeId ? parseInt(String(storeId)) : undefined,
      limit: Math.min(parseInt(String(limit)) || 20, 100),
      offset: parseInt(String(offset)) || 0,
      sortBy: (sortBy as any) || 'newest'
    }

    const result = await productService.getAllProducts(filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, categoryId, minPrice, maxPrice, storeId, limit = 20, offset = 0 } = req.query

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword is required' })
    }

    const filters = {
      keyword: String(keyword),
      categoryId: categoryId ? parseInt(String(categoryId)) : undefined,
      minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
      maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      storeId: storeId ? parseInt(String(storeId)) : undefined,
      limit: Math.min(parseInt(String(limit)) || 20, 100),
      offset: parseInt(String(offset)) || 0
    }

    const result = await productService.searchProducts(filters.keyword, filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const product = await productService.getProductById(parseInt(String(id)))
    res.json({ success: true, data: product })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    next(error)
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getCategories()
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const category = await productService.getCategoryById(parseInt(String(id)))
    res.json({ success: true, data: category })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }
    next(error)
  }
}

export async function getProductsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId } = req.params
    const { limit = 20, offset = 0, sortBy = 'newest' } = req.query

    const filters = {
      limit: Math.min(parseInt(String(limit)) || 20, 100),
      offset: parseInt(String(offset)) || 0,
      sortBy: (sortBy as any) || 'newest'
    }

    const result = await productService.getProductsByCategory(parseInt(String(categoryId)), filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// ─── Admin: Product CRUD ───────────────────────────────────────────────────

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createProductSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const slug = parsed.data.name.toLowerCase().replace(/\s+/g, '-')
    const product = await productService.createProduct({ ...parsed.data, slug })
    res.status(201).json({ success: true, data: product })
  } catch (error) {
    if (error instanceof Error && error.message.includes('nama yang sama')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    next(error)
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateProductSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const slug = parsed.data.name ? parsed.data.name.toLowerCase().replace(/\s+/g, '-') : undefined
    const product = await productService.updateProduct(parseInt(String(req.params.id)), { ...parsed.data, slug })
    res.json({ success: true, data: product })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    if (error instanceof Error && error.message.includes('nama yang sama')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    next(error)
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(parseInt(String(req.params.id)))
    res.json({ success: true, message: 'Produk berhasil dihapus' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    next(error)
  }
}

// ─── Admin: Category CRUD ──────────────────────────────────────────────────

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const slug = parsed.data.name.toLowerCase().replace(/\s+/g, '-')
    const category = await productService.createCategory({ ...parsed.data, slug })
    res.status(201).json({ success: true, data: category })
  } catch (error) {
    if (error instanceof Error && error.message.includes('nama yang sama')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    next(error)
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const slug = parsed.data.name ? parsed.data.name.toLowerCase().replace(/\s+/g, '-') : undefined
    const category = await productService.updateCategory(parseInt(String(req.params.id)), { ...parsed.data, slug })
    res.json({ success: true, data: category })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }
    if (error instanceof Error && error.message.includes('nama yang sama')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    next(error)
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteCategory(parseInt(String(req.params.id)))
    res.json({ success: true, message: 'Kategori berhasil dihapus' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }
    next(error)
  }
}

// ─── Admin: Product Images ─────────────────────────────────────────────────

export async function uploadProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'Tidak ada file yang diupload' })

    const imageUrl = `/uploads/${req.file.filename}`
    const image = await productService.addProductImage(parseInt(String(id)), imageUrl)
    res.status(201).json({ success: true, data: image })
  } catch (error) {
    // Hapus file yatim di disk jika record gagal dibuat (mis. kena limit / produk tidak valid)
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {})
    }
    if (error instanceof Error && error.message === 'Maksimal 3 foto per produk') {
      return res.status(400).json({ success: false, error: error.message })
    }
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    next(error)
  }
}

export async function deleteProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params
    await productService.removeProductImage(parseInt(String(imageId)))
    res.json({ success: true, message: 'Foto berhasil dihapus' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Image not found') {
      return res.status(404).json({ success: false, error: 'Foto tidak ditemukan' })
    }
    next(error)
  }
}
