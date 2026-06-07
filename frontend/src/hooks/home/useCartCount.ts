import { useEffect } from 'react'
import { useCartStore } from '../../store/cartStore'

export const useCartCount = () => {
  const count = useCartStore((state) => state.cartCount)
  const isLoading = useCartStore((state) => state.isLoadingCartCount)
  const loadCartCount = useCartStore((state) => state.loadCartCount)

  useEffect(() => {
    void loadCartCount()
  }, [loadCartCount])

  return { cartCount: count, isLoadingCartCount: isLoading }
}

