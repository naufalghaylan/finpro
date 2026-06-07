import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { addCartItem } from '../api/cart.api'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

type AddToCartProduct = {
  id: number
  name: string
  stocks?: Array<{
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
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setCartCount = useCartStore((state) => state.setCartCount)
  const [addingProductId, setAddingProductId] = useState<number | null>(null)

  const addToCart = async (product: AddToCartProduct, quantity = 1) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (hasKnownOutOfStock(product)) {
      alert('Stok produk sedang habis.')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert('Jumlah produk minimal 1.')
      return
    }

    setAddingProductId(product.id)

    try {
      const result = await addCartItem(product.id, quantity)
      setCartCount(result.cartCount)
      alert(`"${product.name}" ditambahkan ke keranjang`)
    } catch (error) {
      alert(getCartErrorMessage(error))
    } finally {
      setAddingProductId(null)
    }
  }

  return {
    addToCart,
    addingProductId,
  }
}
