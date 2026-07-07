import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Loader2, MapPin, StickyNote, Truck } from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { formatCurrency } from '../../utils/format'
import { useCheckout } from '../../hooks/checkout/useCheckout'
import { CheckoutAddressList } from '../../components/checkout/CheckoutAddressList'
import { CheckoutProductList } from '../../components/checkout/CheckoutProductList'
import { CheckoutStorePanel } from '../../components/checkout/CheckoutStorePanel'
import { CheckoutShippingPanel } from '../../components/checkout/CheckoutShippingPanel'
import { CheckoutPaymentPanel } from '../../components/checkout/CheckoutPaymentPanel'
import { CheckoutSummaryPanel } from '../../components/checkout/CheckoutSummaryPanel'
import { CheckoutSuccessPanel } from '../../components/checkout/CheckoutSuccessPanel'
import { CheckoutEmptyState, CheckoutErrorState, CheckoutLoadingState } from '../../components/checkout/CheckoutStatePanel'
import { CheckoutVoucherPanel } from '../../components/checkout/CheckoutVoucherPanel'
import { CheckoutDiscountPanel } from '../../components/checkout/CheckoutDiscountPanel'

const checkoutFlowStepClassName = [
  'inline-flex items-center justify-center gap-2 rounded-lg border',
  'border-[rgba(232,107,79,0.16)] bg-[rgba(255,255,255,0.76)]',
  'px-3 py-2.75 text-[0.9rem] font-extrabold text-(--ink)',
  'shadow-[0_8px_20px_rgba(31,42,34,0.05)]',
  'max-[720px]:min-w-[136px] max-[720px]:justify-start',
].join(' ')

const checkoutFlowIconClassName = 'size-4.5 shrink-0 text-(--accent-strong)'

function CheckoutPage() {
  const {
    preview,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    selectedVoucherId,
    notes,
    createdOrder,
    isLoading,
    isRefreshingPreview,
    isSubmitting,
    error,
    selectedCourier,
    courierServices,
    selectedShippingService,
    fetchingCouriers,
    paymentSummary,
    canCreateOrder,
    isCartEmpty,
    hasSelectedAddressCoordinates,
    setPaymentMethod,
    setSelectedVoucherId,
    setNotes,
    setSelectedCourier,
    setSelectedShippingService,
    handleAddressChange,
    handleCreateOrder,
    loadPreview,
    fetchShippingForCourier,
  } = useCheckout()

  return (
    <div className="page checkout-flow-page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main checkout-page">
        <section className="shell checkout-shell">
          <Link to="/cart" className="button ghost checkout-back-link">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            Kembali ke Keranjang
          </Link>

          {isLoading ? (
            <CheckoutLoadingState />
          ) : error ? (
            <CheckoutErrorState error={error} onRetry={() => void loadPreview(undefined, true)} />
          ) : createdOrder ? (
            <CheckoutSuccessPanel order={createdOrder as NonNullable<typeof createdOrder>} />
          ) : preview ? (
            <>
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">Checkout</p>
                  <h1>Finalisasi pesananmu</h1>
                  <p>
                    Lengkapi alamat, pengiriman, voucher, dan pembayaran. Cabang PanenMart akan dipilih dari lokasi yang paling sesuai dengan alamatmu.
                  </p>
                </div>
                {isRefreshingPreview && (
                  <span className="checkout-refresh-status">
                    <Loader2 className="button-icon spin" aria-hidden="true" />
                    Memperbarui cabang
                  </span>
                )}
              </div>

              {!isCartEmpty && (
                <div
                  className="grid grid-cols-3 gap-2.5 max-[720px]:flex max-[720px]:overflow-x-auto max-[720px]:pb-0.5 max-[720px]:[scrollbar-width:thin]"
                  aria-label="Urutan checkout"
                >
                  <span className={checkoutFlowStepClassName}>
                    <MapPin className={checkoutFlowIconClassName} aria-hidden="true" />
                    Alamat
                  </span>
                  <span className={checkoutFlowStepClassName}>
                    <Truck className={checkoutFlowIconClassName} aria-hidden="true" />
                    Pengiriman
                  </span>
                  <span className={checkoutFlowStepClassName}>
                    <CreditCard className={checkoutFlowIconClassName} aria-hidden="true" />
                    Pembayaran
                  </span>
                </div>
              )}

              {isCartEmpty ? (
                <CheckoutEmptyState />
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
                      courierServices={courierServices}
                      selectedShippingService={selectedShippingService}
                      fetchingCouriers={fetchingCouriers}
                      onCourierChange={(courier) => {
                        setSelectedCourier(courier)
                        if (courier && !courierServices[courier]) {
                          void fetchShippingForCourier(courier)
                        }
                      }}
                      onShippingServiceChange={setSelectedShippingService}
                    />

                    <CheckoutDiscountPanel />

                    <CheckoutVoucherPanel
                      vouchers={preview.vouchers ?? []}
                      items={preview.cart.items}
                      subtotal={paymentSummary.subtotal}
                      shippingCost={paymentSummary.shippingCost}
                      selectedVoucherId={selectedVoucherId}
                      onVoucherChange={setSelectedVoucherId}
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
                    storeDiscountAmount={paymentSummary.storeDiscountAmount}
                    voucherReferralAmount={paymentSummary.voucherReferralAmount}
                    discountAmount={paymentSummary.discountAmount}
                    selectedShippingService={selectedShippingService}
                    totalPayment={paymentSummary.totalPayment}
                    hasSelectedAddressCoordinates={hasSelectedAddressCoordinates}
                    hasSelectedAddress={Boolean(selectedAddress)}
                    hasNearestBranch={Boolean(preview.nearestStore)}
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
