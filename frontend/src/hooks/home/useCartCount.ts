import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export const useCartCount = () => {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadCartCount = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        if (isMounted) {
          setCount(0)
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/cart/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (isMounted) {
            setCount(0)
          }
          return
        }

        const data = (await response.json()) as { count?: number }

        if (isMounted) {
          setCount(typeof data.count === 'number' ? data.count : 0)
        }
      } catch {
        if (isMounted) {
          setCount(0)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCartCount()

    return () => {
      isMounted = false
    }
  }, [])

  return { cartCount: count, isLoadingCartCount: isLoading }
}

