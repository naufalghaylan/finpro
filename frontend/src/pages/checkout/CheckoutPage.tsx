import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBasket,
  ShoppingBag,
  StickyNote,
  Store,
  Truck,
  WalletCards,
} from 'lucide-react'
import { createCheckoutOrder, getCheckoutPreview } from '../../api/order.api'
import { Navbar } from '../../components/common/Navbar'
import { useToast } from '../../components/common/toastContext'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { useCartStore } from '../../store/cartStore'
import type { CartItem } from '../../types/cart'
import type {
  CheckoutAddress,
  CheckoutOrder,
  CheckoutPreview,
  PaymentMethod,
} from '../../types/order'

type ErrorResponse = {
  message?: string
  error?: string
  code?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const formatDateTime = (value: string | null) => {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? 'Gagal memproses checkout'
  }

  return 'Gagal memproses checkout'
}

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

const getAddressLine = (address: CheckoutAddress) =>
  [address.district, address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(', ')

const getPaymentIcon = (paymentMethod: PaymentMethod) =>
  paymentMethod === 'PAYMENT_GATEWAY' ? CreditCard : WalletCards

function CheckoutPage() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_TRANSFER')
  const [notes, setNotes] = useState('')
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const navigate = useNavigate()
  const setCartCount = useCartStore((state) => state.setCartCount)

  const loadPreview = useCallback(async (addressId?: number, showInitialLoading = false) => {
    if (showInitialLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshingPreview(true)
    }

    try {
      const nextPreview = await getCheckoutPreview(addressId)
      setPreview(nextPreview)
      setSelectedAddressId(nextPreview.selectedAddress?.id ?? null)
      setError(null)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
      setIsRefreshingPreview(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadPreview(undefined, true)
    }, 0)

    return () => {
      window.clearTimeout(initialLoadId)
    }
  }, [loadPreview])

  const selectedAddress = useMemo(
    () => preview?.addresses.find((address) => address.id === selectedAddressId) ?? null,
    [preview?.addresses, selectedAddressId],
  )
  const hasSelectedAddressCoordinates =
    selectedAddress?.latitude !== null &&
    selectedAddress?.latitude !== undefined &&
    selectedAddress.longitude !== null &&
    selectedAddress.longitude !== undefined
  const isCartEmpty = (preview?.cart.items.length ?? 0) === 0
  const paymentSummary = useMemo(() => {
    const subtotal = preview?.cart.summary.subtotal ?? 0

    return {
      subtotal,
      totalPayment: Math.max(0, subtotal),
    }
  }, [preview?.cart.summary.subtotal])
  const canCreateOrder =
    Boolean(selectedAddressId) &&
    hasSelectedAddressCoordinates &&
    Boolean(preview?.nearestStore) &&
    !isCartEmpty &&
    !isRefreshingPreview &&
    !isSubmitting

  const handleAddressChange = (addressId: number) => {
    setSelectedAddressId(addressId)
    void loadPreview(addressId)
  }

  const handleCreateOrder = async () => {
    if (!selectedAddressId || !canCreateOrder) return

    setIsSubmitting(true)
    try {
      const result = await createCheckoutOrder({
        addressId: selectedAddressId,
        paymentMethod,
        notes: notes.trim() || undefined,
      })

      setCreatedOrder(result.order)
      setCartCount(result.cartCount)
      showToast('Pesanan berhasil dibuat', 'success')
      navigate(`/orders/${result.order.id}/payment`)
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                <Link to="/cart" className="button ghost">
                  Lihat Cart
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
                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <MapPin aria-hidden="true" />
                        <div>
                          <h2>Alamat Pengiriman</h2>
                          <p>Pilih alamat yang punya koordinat agar store terdekat bisa dihitung.</p>
                        </div>
                      </div>

                      {preview.addresses.length === 0 ? (
                        <div className="checkout-inline-alert">
                          <AlertCircle aria-hidden="true" />
                          Belum ada alamat tersimpan. Tambahkan alamat terlebih dahulu di fitur profil/alamat.
                        </div>
                      ) : (
                        <div className="checkout-address-grid">
                          {preview.addresses.map((address) => {
                            const hasCoordinates = address.latitude !== null && address.longitude !== null

                            return (
                              <label
                                key={address.id}
                                className={`checkout-address-card ${
                                  selectedAddressId === address.id ? 'selected' : ''
                                } ${!hasCoordinates ? 'warning' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="addressId"
                                  checked={selectedAddressId === address.id}
                                  onChange={() => handleAddressChange(address.id)}
                                />
                                <span className="checkout-address-topline">
                                  <strong>{address.recipientName}</strong>
                                  {address.isPrimary && <em>Utama</em>}
                                </span>
                                <span>{address.phone}</span>
                                <span>{address.address}</span>
                                <span>{getAddressLine(address)}</span>
                                <span className={hasCoordinates ? 'checkout-coordinate-ok' : 'checkout-coordinate-missing'}>
                                  {hasCoordinates ? 'Koordinat tersedia' : 'Koordinat belum tersedia'}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </section>

                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <ShoppingBasket aria-hidden="true" />
                        <div>
                          <h2>Ringkasan Produk</h2>
                          <p>Item dari cart yang akan dibuat menjadi pesanan.</p>
                        </div>
                      </div>

                      <div className="checkout-product-list">
                        {preview.cart.items.map((item) => {
                          const image = getPrimaryImage(item)

                          return (
                            <div key={item.id} className="checkout-product-item">
                              <div className="checkout-summary-image">
                                {image ? <img src={image.imageUrl} alt={item.product.name} /> : <span>Produk</span>}
                              </div>
                              <div className="checkout-product-info">
                                <strong>{item.product.name}</strong>
                                <span>{item.product.category.name}</span>
                                <span>{item.quantity} x {formatCurrency(item.product.basePrice)}</span>
                              </div>
                              <strong>{formatCurrency(item.lineTotal)}</strong>
                            </div>
                          )
                        })}
                      </div>
                    </section>

                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <Store aria-hidden="true" />
                        <div>
                          <h2>Store Terdekat</h2>
                          <p>Order akan diarahkan ke gudang/store paling dekat dari alamat yang dipilih.</p>
                        </div>
                      </div>

                      {preview.nearestStore ? (
                        <div className="checkout-store-card">
                          <div>
                            <span className="store-chip">Store Terpilih</span>
                            <h3>{preview.nearestStore.name}</h3>
                            <p>{preview.nearestStore.address}</p>
                            <p>{preview.nearestStore.city}, {preview.nearestStore.province}</p>
                          </div>
                          <div
                            className={`checkout-distance-badge ${
                              preview.nearestStore.isOutOfRange ? 'warning' : 'success'
                            }`}
                          >
                            <strong>{preview.nearestStore.distance} km</strong>
                            <span>{preview.nearestStore.isOutOfRange ? 'Di luar radius' : 'Dalam radius'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="checkout-inline-alert">
                          <AlertCircle aria-hidden="true" />
                          Pilih alamat dengan koordinat untuk menghitung store terdekat.
                        </div>
                      )}
                    </section>

                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <Truck aria-hidden="true" />
                        <div>
                          <h2>Metode Pengiriman</h2>
                          <p>Opsi pengiriman akan mengikuti data alamat dan ongkir dari Feature 1.</p>
                        </div>
                      </div>

                      <div className="checkout-inline-alert">
                        <AlertCircle aria-hidden="true" />
                        {hasSelectedAddressCoordinates
                          ? 'Metode pengiriman menunggu data dari fitur alamat/pengiriman.'
                          : 'Pilih alamat dengan koordinat untuk menampilkan metode pengiriman.'}
                      </div>
                    </section>

                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <CreditCard aria-hidden="true" />
                        <div>
                          <h2>Metode Pembayaran</h2>
                          <p>Transfer manual menunggu upload bukti bayar, payment gateway langsung masuk proses.</p>
                        </div>
                      </div>

                      <div className="checkout-payment-grid">
                        {preview.paymentMethods.map((method) => {
                          const Icon = getPaymentIcon(method.value)

                          return (
                            <label
                              key={method.value}
                              className={`checkout-payment-card ${paymentMethod === method.value ? 'selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                checked={paymentMethod === method.value}
                                onChange={() => setPaymentMethod(method.value)}
                              />
                              <Icon aria-hidden="true" />
                              <strong>{method.label}</strong>
                              <span>{method.description}</span>
                            </label>
                          )
                        })}
                      </div>
                    </section>

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

                  <aside className="checkout-summary-panel">
                    <h2>Rincian Pembayaran</h2>
                    <div className="cart-summary-row">
                      <span>Total Harga ({preview.cart.summary.totalQuantity} item)</span>
                      <strong>{formatCurrency(paymentSummary.subtotal)}</strong>
                    </div>
                    <div className="cart-summary-row">
                      <span>Ongkir</span>
                      <strong>Rp -</strong>
                    </div>
                    <div className="cart-summary-row checkout-summary-total">
                      <span>Total Bayar</span>
                      <strong>{formatCurrency(paymentSummary.totalPayment)}</strong>
                    </div>

                    {!hasSelectedAddressCoordinates && selectedAddress && (
                      <div className="checkout-inline-alert compact">
                        <AlertCircle aria-hidden="true" />
                        Alamat terpilih belum punya koordinat.
                      </div>
                    )}

                    <button
                      type="button"
                      className="button primary checkout-create-button"
                      disabled={!canCreateOrder}
                      onClick={handleCreateOrder}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="button-icon spin" aria-hidden="true" />
                          Membuat Pesanan
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="button-icon" aria-hidden="true" />
                          Buat Pesanan
                        </>
                      )}
                    </button>
                  </aside>
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
