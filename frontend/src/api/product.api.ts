import api from './axios'
import type { Category, Product, ProductListResponse, ProductFilters, SearchFilters } from '../types/product'

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

