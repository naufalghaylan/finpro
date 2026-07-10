import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, PackageCheck, ShoppingBag } from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { formatCurrency } from '../../utils/format'
import { getCartBlockingReason, getCartItemAvailability } from '../../utils/cartAvailability'
import { useCartPage } from '../../hooks/cart/useCartPage'
import { useAuthStore } from '../../store/authStore'
import { useAddressStore } from '../../store/addressStore'
import { useFulfillmentStore } from '../../store/fulfillmentStore'
import { useLocationSelection } from '../../hooks/home/useLocationSelection'
import { CartItemCard } from '../../components/cart/CartItemCard'
import { CartSummaryPanel } from '../../components/cart/CartSummaryPanel'
import {
  getCartCoords,
  getCartDisplayItems,
  getCartPageSummary,
  getFulfillmentBranch,
  getSelectedCartAddress,
} from './cartPageDisplay'
import { cartEmptyClassName, cartStateIconClassName } from './cartPageClassNames'

function CartPage() {
  const { isAuthenticated } = useAuthStore()
  const { addresses, selectedAddressId, fetchAddresses } = useAddressStore()
  const activeStore = useFulfillmentStore((state) => state.activeStore)
  const { coords } = useLocationSelection()

  useEffect(() => {
    if (isAuthenticated) fetchAddresses()
  }, [isAuthenticated, fetchAddresses])

  const userAddress = useMemo(() => {
    if (!isAuthenticated) return null
    return getSelectedCartAddress(addresses, selectedAddressId)
  }, [isAuthenticated, selectedAddressId, addresses])

  const userCoords = useMemo(() => getCartCoords(isAuthenticated, userAddress, coords), [isAuthenticated, userAddress, coords])
  const cartContext = useMemo(() => {
    if (activeStore?.id) return { storeId: activeStore.id }
    if (userCoords) return { lat: userCoords.lat, lng: userCoords.lng }
    return null
  }, [activeStore?.id, userCoords])

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
  } = useCartPage(cartContext)

  const displayItems = useMemo(() => getCartDisplayItems(cart, quantityDrafts), [cart, quantityDrafts])
  const cartSummary = useMemo(() => getCartPageSummary(displayItems), [displayItems])
  const checkoutBlockedReason = useMemo(() => getCartBlockingReason(displayItems), [displayItems])
  const canCheckout = !checkoutBlockedReason

  const hasItems = displayItems.length > 0
  const fulfillmentBranch = getFulfillmentBranch(cart)

  return (
    <div className="page cart-page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="pt-11 pb-14 max-[720px]:pt-8">
          <div className="shell">
            <div className="section-head cart-header">
              <div>
                <p className="section-kicker">Keranjang</p>
                <h2 className="section-title">Keranjang Belanja</h2>
                <p className="mt-2 mb-0 max-w-[540px] text-(--ink-soft) leading-[1.6]">
                  Periksa produk dan jumlah belanja sebelum lanjut ke checkout.
                </p>
              </div>
              <Link to="/catalog" className="button ghost">
                <ArrowLeft className="button-icon" aria-hidden="true" />
                <span>Belanja lagi</span>
              </Link>
            </div>

            {error && (
              <div
                className="cart-alert error mb-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-3 font-semibold leading-[1.5] [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0"
                role="alert"
              >
                <AlertCircle aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {isLoading && (
              <div className={`${cartEmptyClassName} min-h-[260px]`} aria-live="polite">
                <span className={cartStateIconClassName}>
                  <Loader2 className="spin" aria-hidden="true" />
                </span>
                <h3>Memuat keranjang</h3>
                <p>Produk yang sudah kamu pilih sedang disiapkan.</p>
              </div>
            )}

            {!isLoading && !hasItems && (
              <div className={`${cartEmptyClassName} min-h-80`}>
                <span className={cartStateIconClassName}>
                  <ShoppingBag aria-hidden="true" />
                </span>
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
                <section className="cart-store-group" aria-label="Produk dalam keranjang">
                  <div className="cart-store-header">
                    <div className="cart-store-title">
                      <span className="cart-store-icon">
                        <PackageCheck aria-hidden="true" />
                      </span>
                      <div>
                        <span>Produk PanenMart</span>
                        <strong>Estimasi diproses dari {fulfillmentBranch}</strong>
                        <em>Harga promo dan stok mengikuti cabang aktif. Cabang final mengikuti alamat checkout.</em>
                      </div>
                    </div>
                    <span className="cart-store-count">{cartSummary.totalQuantity} item</span>
                  </div>

                  <div className="cart-list-head" aria-hidden="true">
                    <span>Produk</span>
                    <span>Harga</span>
                    <span>Jumlah</span>
                    <span>Total</span>
                  </div>

                  <div className="cart-items" aria-label="Daftar produk dalam keranjang">
                    {displayItems.map((item) => {
                      const itemBusy = Boolean(savingItemIds[item.id]) || deletingItemId === item.id
                      const availability = getCartItemAvailability(item, item.displayQuantity)

                      return (
                        <CartItemCard
                          key={item.id}
                          item={item}
                          itemBusy={itemBusy}
                          stockUnavailable={availability.blocksCheckout}
                          lowStock={availability.lowStock}
                          fulfilledFromOtherBranch={availability.fulfilledFromOtherBranch}
                          availabilityMessage={availability.message}
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
                </section>

                <CartSummaryPanel
                  totalQuantity={cartSummary.totalQuantity}
                  subtotal={cartSummary.subtotal}
                  discount={cartSummary.discount}
                  total={cartSummary.total}
                  fulfillmentBranch={fulfillmentBranch}
                  canCheckout={canCheckout}
                  checkoutBlockedReason={checkoutBlockedReason}
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
            <strong>{formatCurrency(cartSummary.total)}</strong>
          </div>
          {canCheckout ? (
            <Link to="/checkout" className="button primary">
              Checkout ({cartSummary.totalQuantity})
            </Link>
          ) : (
            <button type="button" className="button primary" disabled>
              Checkout ({cartSummary.totalQuantity})
            </button>
          )}
        </div>
      )}

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}

export default CartPage
