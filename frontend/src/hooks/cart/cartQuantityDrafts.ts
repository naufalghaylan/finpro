import type { Dispatch, SetStateAction } from 'react'
import type { CartItem } from '../../types/cart'

type QuantityDraftSetter = Dispatch<SetStateAction<Record<number, string>>>

export const isCartQuantityDraftInput = (value: string) => value === '' || /^\d+$/.test(value)

export const setCartQuantityDraft = (
  setQuantityDrafts: QuantityDraftSetter,
  itemId: number,
  value: string,
) => {
  setQuantityDrafts((drafts) => ({ ...drafts, [itemId]: value }))
}

export const resetCartQuantityDraft = (setQuantityDrafts: QuantityDraftSetter, item: CartItem) => {
  setCartQuantityDraft(setQuantityDrafts, item.id, String(item.quantity))
}

export const getCartQuantityValidationMessage = (
  item: CartItem,
  nextQuantity: number,
  draftValue?: string,
) => {
  if (draftValue === '' || !Number.isInteger(nextQuantity) || nextQuantity <= 0) {
    return 'Jumlah produk minimal 1'
  }

  if (nextQuantity > item.product.totalStock) {
    return `Stok ${item.product.name} hanya ${item.product.totalStock}`
  }

  return null
}
