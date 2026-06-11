import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

export const useCartCount = () => {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()

  const loadCart = async () => {
    if (!isAuthenticated) {
      setCount(0)
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get('/cart/count')
      const data = response.data
      setCount(typeof data.count === 'number' ? data.count : 0)
    } catch {
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCart()
  }, [isAuthenticated])

  // Add event listener for cart updates
  useEffect(() => {
    const handleCartUpdated = () => {
      if (isAuthenticated) {
        void loadCart()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdated)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated)
    }
  }, [isAuthenticated])

  return { cartCount: count, isLoadingCartCount: isLoading }
}

