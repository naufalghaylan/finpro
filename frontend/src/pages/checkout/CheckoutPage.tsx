import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  StickyNote,
} from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useCheckout } from '../../hooks/checkout/useCheckout'
import { CheckoutAddressList } from '../../components/checkout/CheckoutAddressList'
import { CheckoutProductList } from '../../components/checkout/CheckoutProductList'
import { CheckoutStorePanel } from '../../components/checkout/CheckoutStorePanel'
import { CheckoutShippingPanel } from '../../components/checkout/CheckoutShippingPanel'
import { CheckoutPaymentPanel } from '../../components/checkout/CheckoutPaymentPanel'
import { CheckoutSummaryPanel } from '../../components/checkout/CheckoutSummaryPanel'

function CheckoutPage() {
  const {
    preview,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    notes,
    createdOrder,
    isLoading,
    isRefreshingPreview,
    isSubmitting,
    error,
    selectedCourier,
    shippingCosts,
    selectedShippingService,
    isFetchingShipping,
    paymentSummary,
    canCreateOrder,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    setPaymentMethod,
    setNotes,
    setSelectedCourier,
    setSelectedShippingService,
    handleAddressChange,
    handleCreateOrder,
    loadPreview,
  } = useCheckout()

  return (
    <div>
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="checkout-page">
        <section className="shell checkout-shell">
          <Link to="/cart" className="button ghost checkout-back-link">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            Kembali ke Cart
          </Link>

          {isLoading ? (
            <div className="checkout-state-card">
              <Loader2 className="checkout-state-icon spin" aria-hidden="true" />
              <h2>Menyiapkan checkout...</h2>
              <p>Kami sedang mengambil cart, alamat, dan store terdekat.</p>
            </div>
          ) : error ? (
            <div className="checkout-state-card">
              <AlertCircle className="checkout-state-icon danger" aria-hidden="true" />
              <h2>Checkout belum bisa dibuka</h2>
              <p>{error}</p>
              <button type="button" className="button primary" onClick={() => void loadPreview(undefined, true)}>
                Coba Lagi
              </button>
            </div>
          ) : createdOrder ? (
            <section className="checkout-success-card" aria-live="polite">
              <div className="checkout-success-icon">
                <CheckCircle2 aria-hidden="true" />
              </div>
              <p className="eyebrow">Order berhasil dibuat</p>
              <h1>{createdOrder.orderNumber}</h1>
              <p>
                Status pesanan sekarang <strong>{createdOrder.status}</strong>.{' '}
                {createdOrder.paymentMethod === 'MANUAL_TRANSFER'
                  ? 'Upload bukti pembayaran diperlukan sebelum admin memproses pesanan.'
                  : 'Pembayaran gateway disimulasikan berhasil sehingga order langsung masuk proses.'}
              </p>

              <div className="checkout-success-grid">
                <div>
                  <span>Total Pembayaran</span>
                  <strong>{formatCurrency(createdOrder.totalAmount)}</strong>
                </div>
                <div>
                  <span>Store Pengiriman</span>
                  <strong>{createdOrder.store.name}</strong>
                </div>
                <div>
                  <span>Metode Bayar</span>
                  <strong>
                    {createdOrder.paymentMethod === 'MANUAL_TRANSFER' ? 'Transfer Manual' : 'Payment Gateway'}
                  </strong>
                </div>
                <div>
                  <span>Deadline Bayar</span>
                  <strong>{formatDateTime(createdOrder.paymentDeadline)}</strong>
                </div>
              </div>

              <div className="checkout-success-actions">
                <Link to="/" className="button primary">
                  Lanjut Belanja
                </Link>
                <Link to={`/orders/${createdOrder.id}`} className="button ghost">
                  Lihat Detail Pesanan
                </Link>
              </div>
            </section>
          ) : preview ? (
            <>
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">Checkout</p>
                  <h1>Selesaikan pesananmu</h1>
                  <p>
                    Pilih alamat, pengiriman, dan metode pembayaran. Sistem akan menentukan store terdekat dari
                    koordinat alamatmu.
                  </p>
                </div>
                {isRefreshingPreview && (
                  <span className="checkout-refresh-status">
                    <Loader2 className="button-icon spin" aria-hidden="true" />
                    Memperbarui store
                  </span>
                )}
              </div>

              {isCartEmpty ? (
                <div className="checkout-state-card">
                  <ShoppingBag className="checkout-state-icon" aria-hidden="true" />
                  <h2>Cart masih kosong</h2>
                  <p>Tambahkan produk dulu sebelum membuat pesanan.</p>
                  <Link to="/" className="button primary">
                    Mulai Belanja
                  </Link>
                </div>
              ) : (
                <div className="checkout-layout">
                  <div className="checkout-main-column">
                    <CheckoutAddressList
                      addresses={preview.addresses}
                      selectedAddressId={selectedAddressId}
                      onAddressChange={handleAddressChange}
                    />

                    <CheckoutProductList items={preview.cart.items} />

                    <CheckoutStorePanel nearestStore={preview.nearestStore} />

                    <CheckoutShippingPanel
                      hasSelectedAddressCoordinates={hasSelectedAddressCoordinates}
                      hasNearestStore={Boolean(preview.nearestStore)}
                      selectedCourier={selectedCourier}
                      shippingCosts={shippingCosts}
                      selectedShippingService={selectedShippingService}
                      isFetchingShipping={isFetchingShipping}
                      onCourierChange={setSelectedCourier}
                      onShippingServiceChange={setSelectedShippingService}
                    />

                    <CheckoutPaymentPanel
                      paymentMethods={preview.paymentMethods}
                      selectedPaymentMethod={paymentMethod}
                      onPaymentMethodChange={setPaymentMethod}
                    />

                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <StickyNote aria-hidden="true" />
                        <div>
                          <h2>Catatan Pesanan</h2>
                          <p>Opsional, maksimal 500 karakter.</p>
                        </div>
                      </div>
                      <textarea
                        className="checkout-notes"
                        value={notes}
                        maxLength={500}
                        rows={4}
                        placeholder="Contoh: tolong kirim sore hari."
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </section>
                  </div>

                  <CheckoutSummaryPanel
                    totalQuantity={preview.cart.summary.totalQuantity}
                    subtotal={paymentSummary.subtotal}
                    selectedShippingService={selectedShippingService}
                    totalPayment={paymentSummary.totalPayment}
                    hasSelectedAddressCoordinates={hasSelectedAddressCoordinates}
                    hasSelectedAddress={Boolean(selectedAddress)}
                    canCreateOrder={canCreateOrder}
                    isSubmitting={isSubmitting}
                    onCreateOrder={handleCreateOrder}
                  />
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>

      {preview && !isCartEmpty && !createdOrder && !isLoading && !error && (
        <div className="checkout-mobile-bar">
          <div>
            <span>Total Bayar</span>
            <strong>{formatCurrency(paymentSummary.totalPayment)}</strong>
          </div>
          <button
            type="button"
            className="button primary"
            disabled={!canCreateOrder}
            onClick={handleCreateOrder}
          >
            {isSubmitting ? 'Membuat...' : 'Buat Pesanan'}
          </button>
        </div>
      )}

      <HomeFooter sections={footerSections} brandName={BRAND.name} />
    </div>
  )
}

export default CheckoutPage
