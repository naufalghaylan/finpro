import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteCartItem, updateCartItem } from '../../api/cart.api'
import { useToast } from '../../components/common/toastContext'
import { useCartStore } from '../../store/cartStore'
import type { CartItem } from '../../types/cart'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  getCartQuantityValidationMessage,
  isCartQuantityDraftInput,
  resetCartQuantityDraft,
  setCartQuantityDraft,
} from './cartQuantityDrafts'

const CART_QUANTITY_SAVE_DELAY_MS = 700

const getErrorMessage = (error: unknown) => getApiErrorMessage(error, 'Gagal memproses keranjang')

export function useCartMutations(
  quantityDrafts: Record<number, string>,
  setQuantityDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>,
  setError: (error: string | null) => void,
  loadCart: (showLoading?: boolean) => Promise<void>
) {
  const [savingItemIds, setSavingItemIds] = useState<Record<number, boolean>>({})
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const quantitySaveTimers = useRef<Record<number, number>>({})
  const { showToast } = useToast()
  const setCartCount = useCartStore((state) => state.setCartCount)

  useEffect(() => {
    return () => {
      Object.values(quantitySaveTimers.current).forEach((timerId) => window.clearTimeout(timerId))
      quantitySaveTimers.current = {}
    }
  }, [])

  const clearPendingQuantitySave = useCallback((itemId: number) => {
    const timerId = quantitySaveTimers.current[itemId]
    if (timerId === undefined) return

    window.clearTimeout(timerId)
    delete quantitySaveTimers.current[itemId]
  }, [])

  const setItemSaving = useCallback((itemId: number, isSaving: boolean) => {
    setSavingItemIds((currentSavingItemIds) => {
      const nextSavingItemIds = { ...currentSavingItemIds }

      if (isSaving) {
        nextSavingItemIds[itemId] = true
      } else {
        delete nextSavingItemIds[itemId]
      }

      return nextSavingItemIds
    })
  }, [])

  const showQuantityWarning = useCallback(
    (item: CartItem, message: string) => {
      setError(message)
      showToast(message, 'warning')
      resetCartQuantityDraft(setQuantityDrafts, item)
    },
    [setError, setQuantityDrafts, showToast],
  )

  const persistQuantityUpdate = useCallback(
    async (item: CartItem, nextQuantity: number) => {
      clearPendingQuantitySave(item.id)

      if (getCartQuantityValidationMessage(item, nextQuantity) || nextQuantity === item.quantity) return

      setItemSaving(item.id, true)
      setError(null)

      try {
        const result = await updateCartItem(item.id, nextQuantity)
        setCartCount(result.cartCount)
        await loadCart(false)
      } catch (updateError) {
        const message = getErrorMessage(updateError)
        setError(message)
        showToast(message, 'error')
        resetCartQuantityDraft(setQuantityDrafts, item)
      } finally {
        setItemSaving(item.id, false)
      }
    },
    [clearPendingQuantitySave, loadCart, setCartCount, setItemSaving, showToast, setError, setQuantityDrafts],
  )

  const scheduleQuantityUpdate = useCallback(
    (item: CartItem, nextQuantity: number) => {
      clearPendingQuantitySave(item.id)

      const validationMessage = getCartQuantityValidationMessage(item, nextQuantity)
      if (validationMessage) {
        showQuantityWarning(item, validationMessage)
        return
      }

      setError(null)

      if (nextQuantity === item.quantity) {
        return
      }

      quantitySaveTimers.current[item.id] = window.setTimeout(() => {
        void persistQuantityUpdate(item, nextQuantity)
      }, CART_QUANTITY_SAVE_DELAY_MS)
    },
    [clearPendingQuantitySave, persistQuantityUpdate, setError, showQuantityWarning],
  )

  const handleQuantityDraftChange = (item: CartItem, value: string) => {
    if (!isCartQuantityDraftInput(value)) {
      return
    }

    setCartQuantityDraft(setQuantityDrafts, item.id, value)

    if (value === '') {
      clearPendingQuantitySave(item.id)
      return
    }

    scheduleQuantityUpdate(item, Number(value))
  }

  const handleQuantityUpdate = (item: CartItem, nextQuantity: number) => {
    const validationMessage = getCartQuantityValidationMessage(item, nextQuantity)
    if (validationMessage) {
      showQuantityWarning(item, validationMessage)
      return
    }

    if (nextQuantity === item.quantity) {
      resetCartQuantityDraft(setQuantityDrafts, item)
      clearPendingQuantitySave(item.id)
      setError(null)
      return
    }

    setCartQuantityDraft(setQuantityDrafts, item.id, String(nextQuantity))
    scheduleQuantityUpdate(item, nextQuantity)
  }

  const handleQuantitySubmit = (item: CartItem) => {
    const draftQuantity = quantityDrafts[item.id]
    const nextQuantity = Number(draftQuantity)
    const validationMessage = getCartQuantityValidationMessage(item, nextQuantity, draftQuantity)

    if (validationMessage) {
      clearPendingQuantitySave(item.id)
      showQuantityWarning(item, validationMessage)
      return
    }

    void persistQuantityUpdate(item, nextQuantity)
  }

  const handleDeleteItem = async (item: CartItem) => {
    clearPendingQuantitySave(item.id)
    setDeletingItemId(item.id)
    setError(null)

    try {
      const result = await deleteCartItem(item.id)
      setCartCount(result.cartCount)
      await loadCart(false)
    } catch (deleteError) {
      const message = getErrorMessage(deleteError)
      setError(message)
      showToast(message, 'error')
    } finally {
      setDeletingItemId(null)
    }
  }

  return {
    savingItemIds,
    deletingItemId,
    handleQuantityDraftChange,
    handleQuantityUpdate,
    handleQuantitySubmit,
    handleDeleteItem,
  }
}
