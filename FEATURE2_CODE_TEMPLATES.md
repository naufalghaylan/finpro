# Feature 2: Code Templates & Examples

## Backend Implementation Templates

---

## 1. Product Service Template
**File**: `backend/src/lib/product.service.ts`

```typescript
import { prisma } from './prisma'

// Query filters interface
interface ProductFilters {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  storeId?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'price' | 'newest'
}

interface SearchFilters extends ProductFilters {
  keyword?: string
}

// Get all products with filters
export async function getAllProducts(filters: ProductFilters) {
  const {
    categoryId,
    minPrice,
    maxPrice,
    storeId,
    limit = 20,
    offset = 0,
    sortBy = 'newest'
  } = filters

  // Build where clause
  const where: any = {}
  
  if (categoryId) where.categoryId = categoryId
  if (minPrice || maxPrice) {
    where.basePrice = {}
    if (minPrice) where.basePrice.gte = minPrice
    if (maxPrice) where.basePrice.lte = maxPrice
  }

  // Build orderBy
  const orderBy: any = {}
  switch (sortBy) {
    case 'name':
      orderBy.name = 'asc'
      break
    case 'price':
      orderBy.basePrice = 'asc'
      break
    case 'newest':
    default:
      orderBy.createdAt = 'desc'
  }

  // If filtering by store, need to join with stocks table
  if (storeId) {
    where.stocks = {
      some: {
        storeId,
        quantity: { gt: 0 }
      }
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true }
        },
        stocks: storeId
          ? {
              where: { storeId },
              select: { id: true, quantity: true }
            }
          : false
      },
      orderBy,
      take: limit,
      skip: offset
    }),
    prisma.product.count({ where })
  ])

  return {
    products,
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  }
}

// Search products
export async function searchProducts(keyword: string, filters: SearchFilters) {
  const { limit = 20, offset = 0, ...otherFilters } = filters

  // If keyword provided, search by name or description
  const where: any = {}
  
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } }
    ]
  }

  // Apply other filters
  if (otherFilters.categoryId) where.categoryId = otherFilters.categoryId
  if (otherFilters.minPrice || otherFilters.maxPrice) {
    where.basePrice = {}
    if (otherFilters.minPrice) where.basePrice.gte = otherFilters.minPrice
    if (otherFilters.maxPrice) where.basePrice.lte = otherFilters.maxPrice
  }
  if (otherFilters.storeId) {
    where.stocks = {
      some: {
        storeId: otherFilters.storeId,
        quantity: { gt: 0 }
      }
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        stocks: otherFilters.storeId ? { where: { storeId: otherFilters.storeId } } : false
      },
      take: limit,
      skip: offset
    }),
    prisma.product.count({ where })
  ])

  return { products, total, limit, offset, hasMore: offset + limit < total }
}

// Get product by ID
export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      stocks: {
        include: {
          store: {
            select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true }
          }
        }
      },
      discounts: { where: { isActive: true } }
    }
  })

  if (!product) throw new Error('Product not found')
  return product
}

// Get all categories
export async function getCategories() {
  return await prisma.category.findMany({
    select: { id: true, name: true, slug: true, icon: true, description: true },
    orderBy: { name: 'asc' }
  })
}

// Get category by ID
export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  return category
}

// Get products by category
export async function getProductsByCategory(categoryId: number, filters: ProductFilters) {
  return getAllProducts({ ...filters, categoryId })
}

// Get nearby products (within store radius based on user location)
export async function getNearbyProducts(
  latitude: number,
  longitude: number,
  radiusKm: number,
  filters: ProductFilters
) {
  // This is a simplified version - full geospatial queries would need PostGIS extension
  const stores = await prisma.store.findMany({
    where: {
      AND: [
        { latitude: { gte: latitude - radiusKm / 111 } },
        { latitude: { lte: latitude + radiusKm / 111 } },
        { longitude: { gte: longitude - radiusKm / 111 } },
        { longitude: { lte: longitude + radiusKm / 111 } }
      ]
    },
    select: { id: true }
  })

  const storeIds = stores.map(s => s.id)

  const where: any = { ...filters }
  where.stocks = { some: { storeId: { in: storeIds }, quantity: { gt: 0 } } }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      stocks: {
        where: { storeId: { in: storeIds } },
        include: { store: true }
      }
    },
    take: filters.limit || 20,
    skip: filters.offset || 0
  })

  return products
}
```

---

## 2. Product Controller Template
**File**: `backend/src/controllers/product.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import * as productService from '../lib/product.service'

// Get all products
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
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      storeId: storeId ? parseInt(storeId as string) : undefined,
      limit: Math.min(parseInt(limit as string) || 20, 100), // Max 100
      offset: parseInt(offset as string) || 0,
      sortBy: (sortBy as any) || 'newest'
    }

    const result = await productService.getAllProducts(filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// Search products
export async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, categoryId, minPrice, maxPrice, storeId, limit = 20, offset = 0 } = req.query

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword is required' })
    }

    const filters = {
      keyword: keyword as string,
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      storeId: storeId ? parseInt(storeId as string) : undefined,
      limit: Math.min(parseInt(limit as string) || 20, 100),
      offset: parseInt(offset as string) || 0
    }

    const result = await productService.searchProducts(filters.keyword, filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// Get product by ID
export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const product = await productService.getProductById(parseInt(id))
    res.json({ success: true, data: product })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    next(error)
  }
}

// Get all categories
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getCategories()
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

// Get category by ID
export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const category = await productService.getCategoryById(parseInt(id))
    res.json({ success: true, data: category })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }
    next(error)
  }
}

// Get products by category
export async function getProductsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId } = req.params
    const { limit = 20, offset = 0, sortBy = 'newest' } = req.query

    const filters = {
      limit: Math.min(parseInt(limit as string) || 20, 100),
      offset: parseInt(offset as string) || 0,
      sortBy: (sortBy as any) || 'newest'
    }

    const result = await productService.getProductsByCategory(parseInt(categoryId), filters)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
```

---

## 3. Product Routes Template
**File**: `backend/src/routes/product.routes.ts`

```typescript
import { Router } from 'express'
import * as productController from '../controllers/product.controller'

const router = Router()

// Product endpoints
router.get('/', productController.getAllProducts)
router.get('/search', productController.searchProducts)
router.get('/:id', productController.getProductById)

// Category endpoints (dapat juga di-mount di /api/categories)
router.get('/categories', productController.getCategories)
router.get('/categories/:id', productController.getCategoryById)
router.get('/categories/:categoryId/products', productController.getProductsByCategory)

export default router
```

---

## Frontend Implementation Templates

---

## 4. Product API Service Template
**File**: `frontend/src/services/product.service.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface SearchFilters {
  keyword?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  storeId?: number
  sortBy?: 'name' | 'price' | 'newest'
  limit?: number
  offset?: number
}

// Fetch all products
export async function fetchProducts(filters: Partial<SearchFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}/products?${params}`)
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}

// Search products
export async function searchProducts(keyword: string, filters: Partial<SearchFilters> = {}) {
  const params = new URLSearchParams({ keyword })
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}/products/search?${params}`)
  if (!response.ok) throw new Error('Failed to search products')
  return response.json()
}

// Fetch product by ID
export async function fetchProductById(id: number) {
  const response = await fetch(`${API_BASE}/products/${id}`)
  if (!response.ok) throw new Error('Product not found')
  return response.json()
}

// Fetch all categories
export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`)
  if (!response.ok) throw new Error('Failed to fetch categories')
  return response.json()
}

// Fetch products by category
export async function fetchProductsByCategory(
  categoryId: number,
  filters: Partial<SearchFilters> = {}
) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}/categories/${categoryId}/products?${params}`)
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}
```

---

## 5. Type Definitions Template
**File**: `frontend/src/types/product.ts`

```typescript
export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  categoryId: number
  basePrice: number
  createdAt: string
  updatedAt: string
  category?: Category
  stocks?: Stock[]
  discounts?: Discount[]
}

export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface Stock {
  id: number
  productId: number
  storeId: number
  quantity: number
  store?: Store
}

export interface Store {
  id: number
  name: string
  address: string
  city: string
  latitude: number
  longitude: number
  phone?: string
  serviceRadius: number
}

export interface Discount {
  id: number
  productId: number
  name: string
  description?: string
  discountType: 'PERCENTAGE' | 'NOMINAL' | 'BUY_ONE_GET_ONE' | 'FREE_SHIPPING'
  discountValue: number
  minPurchase: number
  maxDiscount?: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface SearchFilters {
  keyword?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  storeId?: number
  sortBy?: 'name' | 'price' | 'newest'
  limit?: number
  offset?: number
}

export interface ProductsResponse {
  success: boolean
  data: {
    products: Product[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface CategoriesResponse {
  success: boolean
  data: Category[]
}

export interface ProductResponse {
  success: boolean
  data: Product
}
```

---

## 6. Custom Hooks Template
**File**: `frontend/src/hooks/useProducts.ts`

```typescript
import { useState, useEffect } from 'react'
import * as productService from '../services/product.service'
import type { Product, SearchFilters } from '../types/product'

export function useProducts(filters: SearchFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        const response = await productService.fetchProducts(filters)
        setProducts(response.data.products)
        setTotal(response.data.total)
        setHasMore(response.data.hasMore)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [filters.categoryId, filters.minPrice, filters.maxPrice, filters.storeId, filters.sortBy])

  return { products, loading, error, total, hasMore }
}
```

**File**: `frontend/src/hooks/useProductSearch.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import * as productService from '../services/product.service'
import type { Product, SearchFilters } from '../types/product'

export function useProductSearch(keyword: string, filters: SearchFilters = {}) {
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async () => {
    if (!keyword.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await productService.searchProducts(keyword, filters)
      setResults(response.data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [keyword, filters])

  useEffect(() => {
    const timer = setTimeout(search, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [search])

  return { results, loading, error }
}
```

---

## 7. Component Template - ProductCard
**File**: `frontend/src/components/products/ProductCard.tsx`

```typescript
import { useState } from 'react'
import type { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
  onViewDetail: (product: Product) => void
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onViewDetail, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white">
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
        )}

        {/* Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

        {/* Price */}
        <p className="text-lg font-bold text-green-600 mb-4">
          Rp {product.basePrice.toLocaleString('id-ID')}
        </p>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-600 mb-4 line-clamp-2">{product.description}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetail(product)}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
          >
            Detail
          </button>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
          >
            Keranjang
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Update Routes in App.tsx

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/home/HomePage'
import CatalogPage from './pages/products/CatalogPage'
import SearchResultsPage from './pages/products/SearchResultsPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CategoryPage from './pages/products/CategoryPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Product routes */}
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>
    </Router>
  )
}

export default App
```

---

## Implementation Notes

1. **Backend Service Layer**: Handles all database queries dengan Prisma
2. **Controller Layer**: Validates input dan handles HTTP requests/responses
3. **Frontend Service**: Wrapper untuk API calls, dapat di-extend dengan caching
4. **Custom Hooks**: Manage component state untuk data loading
5. **Type Safety**: Gunakan TypeScript types di semua layer

---

## Testing Examples

### Backend (Postman/Thunder Client)
```
GET http://localhost:5000/api/products?limit=10&sortBy=newest
GET http://localhost:5000/api/products/search?keyword=apple&categoryId=2
GET http://localhost:5000/api/products/1
GET http://localhost:5000/api/categories
```

### Frontend (Console testing)
```javascript
import * as productService from './services/product.service'

// Test
productService.searchProducts('apple', { categoryId: 2 })
  .then(res => console.log(res))
  .catch(err => console.error(err))
```

