import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { deleteCartItem, getCart, updateCartItem } from '../../api/cart.api'
import { Navbar } from '../../components/common/Navbar'
import { useToast } from '../../components/common/toastContext'
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
  const [savingItemIds, setSavingItemIds] = useState<Record<number, boolean>>({})
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const quantitySaveTimers = useRef<Record<number, number>>({})
  const { showToast } = useToast()
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
      { label: `Total harga (${cartSummary.totalQuantity} item)`, value: formatCurrency(cartSummary.subtotal) },
      { label: 'Ongkir', value: 'Pilih di checkout' },
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

      try {
        const result = await updateCartItem(item.id, nextQuantity)
        setCartCount(result.cartCount)
        await loadCart(false)
      } catch (updateError) {
        const message = getErrorMessage(updateError)
        setError(message)
        showToast(message, 'error')
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      } finally {
        setItemSaving(item.id, false)
      }
    },
    [clearPendingQuantitySave, loadCart, setCartCount, setItemSaving, showToast],
  )

  const scheduleQuantityUpdate = useCallback(
    (item: CartItem, nextQuantity: number) => {
      clearPendingQuantitySave(item.id)

      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        const message = 'Jumlah produk minimal 1'
        setError(message)
        showToast(message, 'warning')
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
        return
      }

      if (nextQuantity > item.product.totalStock) {
        const message = `Stok ${item.product.name} hanya ${item.product.totalStock}`
        setError(message)
        showToast(message, 'warning')
        setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
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
    [clearPendingQuantitySave, persistQuantityUpdate, showToast],
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
      const message = 'Jumlah produk minimal 1'
      setError(message)
      showToast(message, 'warning')
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    if (nextQuantity > item.product.totalStock) {
      const message = `Stok ${item.product.name} hanya ${item.product.totalStock}`
      setError(message)
      showToast(message, 'warning')
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
      const message = 'Jumlah produk minimal 1'
      setError(message)
      showToast(message, 'warning')
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
      return
    }

    if (nextQuantity > item.product.totalStock) {
      clearPendingQuantitySave(item.id)
      const message = `Stok ${item.product.name} hanya ${item.product.totalStock}`
      setError(message)
      showToast(message, 'warning')
      setQuantityDrafts((drafts) => ({ ...drafts, [item.id]: String(item.quantity) }))
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
                <ArrowLeft className="button-icon" aria-hidden="true" />
                <span>Belanja lagi</span>
              </Link>
            </div>

            {error && <div className="cart-alert error">{error}</div>}

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
                  <ShoppingBag className="button-icon" aria-hidden="true" />
                  <span>Lihat katalog</span>
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
                    const lowStock = !stockUnavailable && item.product.totalStock <= 2

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
                              {lowStock ? (
                                <p className="cart-item-meta warning">
                                  <AlertTriangle className="button-icon" aria-hidden="true" />
                                  <span>Stok sisa {item.product.totalStock}</span>
                                </p>
                              ) : (
                                <p className="cart-item-meta">
                                  {stockUnavailable
                                    ? 'Stok habis'
                                    : `${item.product.totalStock} stok tersedia`}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              className="button ghost icon-only cart-remove-button"
                              disabled={itemBusy}
                              aria-label={`Hapus ${item.product.name} dari keranjang`}
                              title="Hapus"
                              onClick={() => void handleDeleteItem(item)}
                            >
                              <Trash2 className="button-icon" aria-hidden="true" />
                              <span className="sr-only">
                                {deletingItemId === item.id ? 'Menghapus...' : 'Hapus'}
                              </span>
                            </button>
                          </div>

                          <div className="cart-item-bottom">
                            <p className="cart-item-price">{formatCurrency(item.product.basePrice)}</p>
                            <div className="cart-quantity-control" aria-label={`Jumlah ${item.product.name}`}>
                              <button
                                type="button"
                                className="button ghost"
                                disabled={itemBusy || (stockUnavailable && item.displayQuantity > 1)}
                                aria-label={
                                  item.displayQuantity <= 1
                                    ? `Hapus ${item.product.name} dari keranjang`
                                    : `Kurangi jumlah ${item.product.name}`
                                }
                                onClick={() => {
                                  if (item.displayQuantity <= 1) {
                                    void handleDeleteItem(item)
                                    return
                                  }

                                  handleQuantityUpdate(item, item.displayQuantity - 1)
                                }}
                              >
                                <Minus className="button-icon" aria-hidden="true" />
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
                                aria-label={`Tambah jumlah ${item.product.name}`}
                                onClick={() => handleQuantityUpdate(item, item.displayQuantity + 1)}
                              >
                                <Plus className="button-icon" aria-hidden="true" />
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
                  <h3>Rincian Belanja</h3>
                  {summaryRows.map((row) => (
                    <div className="cart-summary-row" key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                  <div className="cart-summary-row cart-summary-total">
                    <span>Total sementara</span>
                    <strong>{formatCurrency(cartSummary.subtotal)}</strong>
                  </div>
                  <Link to="/checkout" className="button primary cart-checkout-button">
                    <span>Checkout ({cartSummary.totalQuantity})</span>
                    <ArrowRight className="button-icon" aria-hidden="true" />
                  </Link>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>

      {!isLoading && hasItems && (
        <div className="cart-mobile-checkout-bar">
          <div>
            <span>Total sementara</span>
            <strong>{formatCurrency(cartSummary.subtotal)}</strong>
          </div>
          <Link to="/checkout" className="button primary">
            Checkout ({cartSummary.totalQuantity})
          </Link>
        </div>
      )}

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}

export default CartPage
