import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { formatCurrency } from '../../utils/format'
import { useCartPage } from '../../hooks/cart/useCartPage'
import { CartItemCard } from '../../components/cart/CartItemCard'
import { CartSummaryPanel } from '../../components/cart/CartSummaryPanel'
import type { CartItem } from '../../types/cart'

type CartItemView = CartItem & {
  displayQuantity: number
  displayUnitPrice: number
  displayLineTotal: number
}

const getDisplayUnitPrice = (item: CartItem) =>
  item.quantity > 0 ? item.lineTotal / item.quantity : item.product.basePrice

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
  const {
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
  } = useCartPage()

  const displayItems = useMemo<CartItemView[]>(
    () =>
      cart.items.map((item) => {
        const displayQuantity = getDisplayQuantity(item, quantityDrafts)
        const displayUnitPrice = getDisplayUnitPrice(item)

        return {
          ...item,
          displayQuantity,
          displayUnitPrice,
          displayLineTotal: displayQuantity * displayUnitPrice,
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
                    const itemBusy = Boolean(savingItemIds[item.id]) || deletingItemId === item.id
                    const stockUnavailable = item.product.totalStock <= 0
                    const lowStock = !stockUnavailable && item.product.totalStock <= 2

                    return (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        itemBusy={itemBusy}
                        stockUnavailable={stockUnavailable}
                        lowStock={lowStock}
                        quantityDraft={quantityDrafts[item.id]}
                        deletingItemId={deletingItemId}
                        onDelete={handleDeleteItem}
                        onQuantityUpdate={handleQuantityUpdate}
                        onQuantityDraftChange={handleQuantityDraftChange}
                        onQuantitySubmit={handleQuantitySubmit}
                      />
                    )
                  })}
                </div>

                <CartSummaryPanel 
                  totalQuantity={cartSummary.totalQuantity} 
                  subtotal={cartSummary.subtotal} 
                />
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
