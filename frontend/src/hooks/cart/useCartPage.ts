import { useCallback, useEffect, useState } from 'react'
import { getCart, type CartContext } from '../../api/cart.api'
import { useCartStore } from '../../store/cartStore'
import type { Cart } from '../../types/cart'
import { getApiFetchError, type ApiFetchError } from '../../utils/apiError'
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

const createCartFetchError = (error: unknown) => getApiFetchError(error, 'Gagal memproses keranjang')

const createCartInlineError = (message: string): ApiFetchError => ({
  message,
  code: 500,
})

const getQuantityDrafts = (cart: Cart) =>
  cart.items.reduce<Record<number, string>>((drafts, item) => {
    drafts[item.id] = String(item.quantity)
    return drafts
  }, {})

export function useCartPage(context: CartContext | null = null) {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<ApiFetchError | null>(null)
  const setCartCount = useCartStore((state) => state.setCartCount)
  const error = fetchError?.message ?? null

  const setInlineError = useCallback((message: string | null) => {
    setFetchError(message ? createCartInlineError(message) : null)
  }, [])

  const loadCart = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const nextCart = await getCart(context)
      setCart(nextCart)
      setQuantityDrafts(getQuantityDrafts(nextCart))
      setCartCount(nextCart.summary.totalQuantity)
      setFetchError(null)
    } catch (loadError) {
      setFetchError(createCartFetchError(loadError))
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [setCartCount, context])

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
  } = useCartMutations(quantityDrafts, setQuantityDrafts, setInlineError, loadCart, context?.storeId)

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
