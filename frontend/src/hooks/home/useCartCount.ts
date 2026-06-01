import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

export const useCartCount = () => {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    const loadCartCount = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setCount(0)
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await api.get('/cart/count')
        const data = response.data

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
  }, [isAuthenticated])

  return { cartCount: count, isLoadingCartCount: isLoading }
}

