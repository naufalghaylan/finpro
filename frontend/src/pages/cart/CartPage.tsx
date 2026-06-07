import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { deleteCartItem, getCart, updateCartItem } from '../../api/cart.api'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { useCartStore } from '../../store/cartStore'
import type { Cart, CartItem } from '../../types/cart'

const emptyCart: Cart = {
  id: null,
  store: null,
  items: [],
  summary: {
    totalQuantity: 0,
    subtotal: 0,
  },
}

const CART_QUANTITY_SAVE_DELAY_MS = 700

type ErrorResponse = {
  message?: string
  error?: string
}

type CartItemView = CartItem & {
  displayQuantity: number
  displayLineTotal: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? 'Gagal memproses keranjang'
  }

  return 'Gagal memproses keranjang'
}

const getQuantityDrafts = (cart: Cart) =>
  cart.items.reduce<Record<number, string>>((drafts, item) => {
    drafts[item.id] = String(item.quantity)
    return drafts
  }, {})

const getDisplayQuantity = (item: CartItem, drafts: Record<number, string>) => {
  const draft = drafts[item.id]
  if (draft === undefined || draft === '') {
    return item.quantity
  }

  const quantity = Number(draft)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return item.quantity
  }

  if (item.product.totalStock > 0 && quantity > item.product.totalStock) {
    return item.quantity
  }

  return quantity
}

function CartPage() {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [savingItemIds, setSavingItemIds] = useState<Record<number, boolean>>({})
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const quantitySaveTimers = useRef<Record<number, number>>({})
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

  useEffect(() => {
    return () => {
      Object.values(quantitySaveTimers.current).forEach((timerId) => window.clearTimeout(timerId))
      quantitySaveTimers.current = {}
    }
  }, [])

  const displayItems = useMemo<CartItemView[]>(
    () =>
      cart.items.map((item) => {
        const displayQuantity = getDisplayQuantity(item, quantityDrafts)

        return {
          ...item,
          displayQuantity,
          displayLineTotal: displayQuantity * item.product.basePrice,
        }
      }),
    [cart.items, quantityDrafts],
  )

  const cartSummary = useMemo(
    () =>
      displayItems.reduce(
        (summary, item) => ({
          totalQuantity: summary.totalQuantity + item.displayQuantity,
          subtotal: summary.subtotal + item.displayLineTotal,
        }),
        { totalQuantity: 0, subtotal: 0 },
      ),
    [displayItems],
  )

  const hasItems = displayItems.length > 0

  const summaryRows = useMemo(
    () => [
      { label: 'Total produk', value: `${cartSummary.totalQuantity} item` },
      { label: 'Subtotal', value: formatCurrency(cartSummary.subtotal) },
    ],
    [cartSummary.subtotal, cartSummary.totalQuantity],
  )

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

  const persistQuantityUpdate = useCallback(
    async (item: CartItem, nextQuantity: number) => {
      clearPendingQuantitySave(item.id)

      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        return
      }

      if (nextQuantity > item.product.totalStock || nextQuantity === item.quantity) {
        return
      }

      setItemSaving(item.id, true)
      setError(null)
      setSuccessMessage(null)

      try {
        const result = await updateCartItem(item.id, nextQuantity)
        setCartCount(result.cartCount)
        await loadCart(false)
        setSuccessMessage('Jumlah produk berhasil diperbarui')
      } catch (updateError) {
        setError(getErrorMessage(updateError))
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      } finally {
        setItemSaving(item.id, false)
      }
    },
    [clearPendingQuantitySave, loadCart, setCartCount, setItemSaving],
  )

  const scheduleQuantityUpdate = useCallback(
    (item: CartItem, nextQuantity: number) => {
      clearPendingQuantitySave(item.id)

      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        setError('Jumlah produk minimal 1')
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
        return
      }

      if (nextQuantity > item.product.totalStock) {
        setError(`Stok ${item.product.name} hanya ${item.product.totalStock}`)
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
        return
      }

      setError(null)
      setSuccessMessage(null)

      if (nextQuantity === item.quantity) {
        return
      }

      quantitySaveTimers.current[item.id] = window.setTimeout(() => {
        void persistQuantityUpdate(item, nextQuantity)
      }, CART_QUANTITY_SAVE_DELAY_MS)
    },
    [clearPendingQuantitySave, persistQuantityUpdate],
  )

  const handleQuantityDraftChange = (item: CartItem, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }

    setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: value }))

    if (value === '') {
      clearPendingQuantitySave(item.id)
      return
    }

    scheduleQuantityUpdate(item, Number(value))
  }

  const handleQuantityUpdate = (item: CartItem, nextQuantity: number) => {
    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      setError('Jumlah produk minimal 1')
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    if (nextQuantity > item.product.totalStock) {
      setError(`Stok ${item.product.name} hanya ${item.product.totalStock}`)
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    if (nextQuantity === item.quantity) {
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      clearPendingQuantitySave(item.id)
      setError(null)
      return
    }

    setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(nextQuantity) }))
    scheduleQuantityUpdate(item, nextQuantity)
  }

  const handleQuantitySubmit = (item: CartItem) => {
    const draftQuantity = quantityDrafts[item.id]
    const nextQuantity = Number(draftQuantity)

    if (draftQuantity === '' || !Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      clearPendingQuantitySave(item.id)
      setError('Jumlah produk minimal 1')
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    if (nextQuantity > item.product.totalStock) {
      clearPendingQuantitySave(item.id)
      setError(`Stok ${item.product.name} hanya ${item.product.totalStock}`)
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    void persistQuantityUpdate(item, nextQuantity)
  }

  const handleDeleteItem = async (item: CartItem) => {
    clearPendingQuantitySave(item.id)
    setDeletingItemId(item.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await deleteCartItem(item.id)
      setCartCount(result.cartCount)
      await loadCart(false)
      setSuccessMessage(`${item.product.name} dihapus dari keranjang`)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeletingItemId(null)
    }
  }

  return (
    <div className="page cart-page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="section cart-section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">Shopping Cart</p>
                <h2 className="section-title">Keranjang Belanja</h2>
              </div>
              <Link to="/catalog" className="button ghost">
                Belanja lagi
              </Link>
            </div>

            {error && <div className="cart-alert error">{error}</div>}
            {successMessage && <div className="cart-alert success">{successMessage}</div>}

            {isLoading && (
              <div className="cart-empty">
                <p>Memuat keranjang...</p>
              </div>
            )}

            {!isLoading && !hasItems && (
              <div className="cart-empty">
                <h3>Keranjang masih kosong</h3>
                <p>Pilih produk segar dari katalog untuk mulai belanja.</p>
                <Link to="/catalog" className="button primary">
                  Lihat katalog
                </Link>
              </div>
            )}

            {!isLoading && hasItems && (
              <div className="cart-layout">
                <div className="cart-items" aria-label="Daftar produk dalam keranjang">
                  {displayItems.map((item) => {
                    const image = getPrimaryImage(item)
                    const itemBusy = Boolean(savingItemIds[item.id]) || deletingItemId === item.id
                    const stockUnavailable = item.product.totalStock <= 0

                    return (
                      <article className="cart-item" key={item.id}>
                        <div className="cart-item-image">
                          {image ? (
                            <img src={image.imageUrl} alt={item.product.name} />
                          ) : (
                            <span>Tidak ada gambar</span>
                          )}
                        </div>

                        <div className="cart-item-content">
                          <div className="cart-item-top">
                            <div>
                              <span className="product-tag">{item.product.category.name}</span>
                              <h3>{item.product.name}</h3>
                              <p className="cart-item-meta">
                                {stockUnavailable
                                  ? 'Stok habis'
                                  : `${item.product.totalStock} stok tersedia`}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="button ghost cart-remove-button"
                              disabled={itemBusy}
                              onClick={() => void handleDeleteItem(item)}
                            >
                              {deletingItemId === item.id ? 'Menghapus...' : 'Hapus'}
                            </button>
                          </div>

                          <div className="cart-item-bottom">
                            <p className="cart-item-price">{formatCurrency(item.product.basePrice)}</p>
                            <div className="cart-quantity-control" aria-label={`Jumlah ${item.product.name}`}>
                              <button
                                type="button"
                                className="button ghost"
                                disabled={itemBusy || stockUnavailable || item.displayQuantity <= 1}
                                onClick={() => handleQuantityUpdate(item, item.displayQuantity - 1)}
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={quantityDrafts[item.id] ?? String(item.quantity)}
                                disabled={itemBusy || stockUnavailable}
                                onChange={(event) => handleQuantityDraftChange(item, event.target.value)}
                                onBlur={() => handleQuantitySubmit(item)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.currentTarget.blur()
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="button ghost"
                                disabled={itemBusy || stockUnavailable || item.displayQuantity >= item.product.totalStock}
                                onClick={() => handleQuantityUpdate(item, item.displayQuantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <p className="cart-line-total">{formatCurrency(item.displayLineTotal)}</p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <aside className="cart-summary-panel" aria-label="Ringkasan keranjang">
                  <h3>Ringkasan</h3>
                  {summaryRows.map((row) => (
                    <div className="cart-summary-row" key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                  <Link to="/checkout" className="button primary cart-checkout-button">
                    Checkout
                  </Link>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}

export default CartPage
