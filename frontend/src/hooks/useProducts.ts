import { useState, useEffect } from 'react'
import { getAllProducts } from '../api/product.api'
import type { Product, ProductFilters } from '../types/product'

export function useProducts(filters?: ProductFilters) {
    const [products, setProducts] = useState<Product[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        getAllProducts(filters)
            .then((res) => {
            setProducts(res.products)
            setTotal(res.total)

            })
            .catch(() => setError('Gagal memuat produk'))
            .finally(() => setLoading(false))
    }, [JSON.stringify(filters)])

    return { products, total, loading, error }
}