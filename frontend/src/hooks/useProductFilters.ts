import { useState, useCallback } from 'react'
import type { ProductFilters } from '../types/product'

const DEFAULT_LIMIT = 20

/**
 * Hook untuk mengelola state filter + pagination produk.
 * Dipakai bersama oleh CatalogPage & SearchPage supaya logikanya tidak diduplikasi.
 */
export function useProductFilters(initial: ProductFilters = {}) {
  const [filters, setFilters] = useState<ProductFilters>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    sortBy: 'newest',
    ...initial,
  })

  // Ubah sebagian filter; selalu reset ke halaman pertama (offset 0).
  const changeFilter = useCallback((next: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...next, offset: 0 }))
  }, [])

  const nextPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? DEFAULT_LIMIT),
    }))
  }, [])

  const prevPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? DEFAULT_LIMIT)),
    }))
  }, [])

  // Hitung info halaman dari total hasil yang didapat saat fetch.
  const getPageInfo = useCallback((total: number) => {
    const limit = filters.limit ?? DEFAULT_LIMIT
    const currentPage = Math.floor((filters.offset ?? 0) / limit) + 1
    const totalPages = Math.ceil(total / limit)
    return { currentPage, totalPages }
  }, [filters.limit, filters.offset])

  return { filters, changeFilter, nextPage, prevPage, getPageInfo }
}
