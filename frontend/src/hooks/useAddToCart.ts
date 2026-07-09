import { useState } from 'react'
import { isAxiosError } from 'axios'
import { addCartItem } from '../api/cart.api'
import { useToast } from '../components/common/toastContext'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

type AddToCartProduct = {
  id: number
  name: string
  stocks?: Array<{
    storeId?: number
    quantity: number
  }>
}

type CartErrorResponse = {
  message?: string
  error?: string
}

const getTotalStock = (product: AddToCartProduct) =>
  product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) ?? 0

const hasKnownOutOfStock = (product: AddToCartProduct) =>
  Array.isArray(product.stocks) && getTotalStock(product) <= 0

const getProductStoreId = (product: AddToCartProduct, storeId?: number) =>
  storeId ?? product.stocks?.find((stock) => stock.quantity > 0)?.storeId ?? product.stocks?.[0]?.storeId

const getCartErrorMessage = (error: unknown) => {
  if (isAxiosError<CartErrorResponse>(error)) {
    const status = error.response?.status
    if (status === 401) return 'Silakan login terlebih dahulu untuk menambahkan produk.'
    if (status === 403) return 'Akun kamu perlu diverifikasi sebelum menambahkan produk.'

    return error.response?.data?.message ?? error.response?.data?.error ?? 'Gagal menambahkan produk.'
  }

  return 'Gagal menambahkan produk.'
}

export const useAddToCart = () => {
  const { showToast } = useToast()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setCartCount = useCartStore((state) => state.setCartCount)
  const [addingProductId, setAddingProductId] = useState<number | null>(null)

  const addToCart = async (product: AddToCartProduct, quantity = 1, storeId?: number) => {
    if (!isAuthenticated) {
      showToast('Silakan login terlebih dahulu untuk menambahkan produk.', 'warning')
      return
    }

    if (hasKnownOutOfStock(product)) {
      showToast('Stok produk sedang habis.', 'warning')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      showToast('Jumlah produk minimal 1.', 'warning')
      return
    }

    setAddingProductId(product.id)

    try {
      const result = await addCartItem(product.id, quantity, getProductStoreId(product, storeId))
      setCartCount(result.cartCount)
      window.dispatchEvent(new Event('cartUpdated'))
      showToast(`"${product.name}" ditambahkan ke keranjang`, 'success')
    } catch (error) {
      showToast(getCartErrorMessage(error), 'error')
    } finally {
      setAddingProductId(null)
    }
  }

  return {
    addToCart,
    addingProductId,
  }
}
