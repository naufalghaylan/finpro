import api from './axios'
import type { Category, Product, ProductImage, ProductListResponse, ProductFilters, SearchFilters } from '../types/product'

// fungtion get
export async function getAllProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    const { data } = await api.get('/products',{ params: filters})
    return data.data
}

// function serch
export async function searchProducts(filters: SearchFilters): Promise<ProductListResponse> {
    const { data } = await api.get('/products/search', { params: filters })
    return data.data
}

// fungtion get detail product
export async function getProductById(id: number): Promise<Product> {
    const { data } = await api.get(`/products/${id}`)
    return data.data
}

// function get all category
export async function getCategories(): Promise<Category[]> {
    const { data } = await api.get('/categories')
    return data.data
}

// ─── Admin: Product CRUD ───────────────────────────────────────────────────

export async function adminCreateProduct(data: {
  name: string
  description?: string
  categoryId: number
  basePrice: number
  weight?: number
}): Promise<Product> {
  const { data: res } = await api.post('/products', data)
  return res.data
}

export async function adminUpdateProduct(id: number, data: {
  name?: string
  description?: string
  categoryId?: number
  basePrice?: number
  weight?: number
}): Promise<Product> {
  const { data: res } = await api.put(`/products/${id}`, data)
  return res.data
}

export async function adminDeleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function adminUploadProductImage(productId: number, file: File): Promise<ProductImage> {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post(`/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.data
}

export async function adminDeleteProductImage(imageId: number): Promise<void> {
  await api.delete(`/products/images/${imageId}`)
}

// ─── Admin: Category CRUD ──────────────────────────────────────────────────

export async function adminCreateCategory(data: {
  name: string
  icon?: string
  description?: string
}): Promise<Category> {
  const { data: res } = await api.post('/categories', data)
  return res.data
}

export async function adminUpdateCategory(id: number, data: {
  name?: string
  icon?: string
  description?: string
}): Promise<Category> {
  const { data: res } = await api.put(`/categories/${id}`, data)
  return res.data
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`)
}
