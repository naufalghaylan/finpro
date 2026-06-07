export type Category = {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
}

// type product image
export type ProductImage = {
  id: number
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
}

// type store (untuk ditampilkan di detail produk)
export type Store = {
  id: number
  name: string
  address: string
  city: string
}

// type stock
export type Stock = {
  id: number
  quantity: number
  store?: Store   // <-- tambah ini
}


// type discount
export type Discount = {
  id: number
  discountType: string
  discountValue: number
  isActive: boolean
}

// type product
export type Product = {
  id: number
  name: string
  slug: string
  description?: string
  weight: number
  basePrice: number
  category: Category
  images: ProductImage[]
  stocks: Stock[]
  discounts?: Discount[]
}

// type response
export type ProductListResponse = {
  products: Product[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// type filter/query params
export type ProductFilters = {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'price' | 'newest'
  storeId?: string
}

export type SearchFilters = ProductFilters & {
  keyword: string
}
