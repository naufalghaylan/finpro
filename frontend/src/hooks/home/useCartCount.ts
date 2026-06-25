import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

export const useCartCount = () => {
  const { isAuthenticated } = useAuthStore()
  const cartCount = useCartStore((state) => state.cartCount)
  const isLoadingCartCount = useCartStore((state) => state.isLoadingCartCount)
  const loadCartCount = useCartStore((state) => state.loadCartCount)
  const resetCartCount = useCartStore((state) => state.resetCartCount)

  useEffect(() => {
    if (!isAuthenticated) {
      resetCartCount()
      return
    }

    void loadCartCount()
  }, [isAuthenticated, loadCartCount, resetCartCount])

  useEffect(() => {
    const handleCartUpdated = () => {
      if (isAuthenticated) {
        void loadCartCount()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdated)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated)
    }
  }, [isAuthenticated, loadCartCount])

  return { cartCount, isLoadingCartCount }
}

