import { useState, useEffect } from 'react'
import { searchProducts } from '../api/product.api'
import type { Product, ProductFilters } from '../types/product'

/**
 * Hook untuk mencari produk berdasarkan keyword + filter.
 * Sejajar dengan useProducts, tapi memakai endpoint /products/search.
 * Jika keyword kosong, hasil dikosongkan tanpa memanggil API.
 */
export function useProductSearch(keyword: string, filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!keyword) {
      setProducts([])
      setTotal(0)
      return
    }
    setLoading(true)
    setError(null)
    searchProducts({ keyword, ...filters })
      .then(res => {
        setProducts(res.products)
        setTotal(res.total)
      })
      .catch(() => setError('Gagal mencari produk'))
      .finally(() => setLoading(false))
  }, [keyword, JSON.stringify(filters)])

  return { products, total, loading, error }
}
