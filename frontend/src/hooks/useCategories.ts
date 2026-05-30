import { useState, useEffect, useCallback } from 'react'
import { getCategories } from '../api/product.api'
import type { Category } from '../types/product'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    getCategories()
      .then(setCategories)
      .catch(() => setError('Gagal memuat kategori'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { categories, loading, error, refetch: fetch }
}
