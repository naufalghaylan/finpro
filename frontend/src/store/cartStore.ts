import { create } from 'zustand'
import api from '../api/axios'

type CartCountResponse = {
  count?: number
}

type CartStore = {
  cartCount: number
  isLoadingCartCount: boolean
  loadCartCount: () => Promise<void>
  setCartCount: (count: number) => void
  resetCartCount: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  cartCount: 0,
  isLoadingCartCount: true,

  loadCartCount: async () => {
    try {
      const { data } = await api.get<CartCountResponse>('/cart/count')
      set({
        cartCount: typeof data.count === 'number' ? data.count : 0,
        isLoadingCartCount: false,
      })
    } catch {
      set({
        cartCount: 0,
        isLoadingCartCount: false,
      })
    }
  },

  setCartCount: (cartCount) => {
    set({ cartCount, isLoadingCartCount: false })
  },

  resetCartCount: () => {
    set({ cartCount: 0, isLoadingCartCount: false })
  },
}))
