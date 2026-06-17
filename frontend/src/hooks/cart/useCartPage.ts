import { useCallback, useEffect, useState } from 'react'
import { getCart } from '../../api/cart.api'
import { useCartStore } from '../../store/cartStore'
import type { Cart } from '../../types/cart'
import { getApiErrorMessage } from '../../utils/apiError'
import { useCartMutations } from './useCartMutations'

const emptyCart: Cart = {
  id: null,
  store: null,
  items: [],
  summary: {
    totalQuantity: 0,
    subtotal: 0,
  },
}

const getErrorMessage = (error: unknown) => getApiErrorMessage(error, 'Gagal memproses keranjang')

const getQuantityDrafts = (cart: Cart) =>
  cart.items.reduce<Record<number, string>>((drafts, item) => {
    drafts[item.id] = String(item.quantity)
    return drafts
  }, {})

export function useCartPage() {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setCartCount = useCartStore((state) => state.setCartCount)

  const loadCart = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const nextCart = await getCart()
      setCart(nextCart)
      setQuantityDrafts(getQuantityDrafts(nextCart))
      setCartCount(nextCart.summary.totalQuantity)
      setError(null)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [setCartCount])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadCart()
    }, 0)

    return () => {
      window.clearTimeout(initialLoadId)
    }
  }, [loadCart])

  const {
    savingItemIds,
    deletingItemId,
    handleQuantityDraftChange,
    handleQuantityUpdate,
    handleQuantitySubmit,
    handleDeleteItem,
  } = useCartMutations(quantityDrafts, setQuantityDrafts, setError, loadCart)

  return {
    cart,
    isLoading,
    error,
    quantityDrafts,
    savingItemIds,
    deletingItemId,
    handleQuantityDraftChange,
    handleQuantityUpdate,
    handleQuantitySubmit,
    handleDeleteItem,
  }
}
