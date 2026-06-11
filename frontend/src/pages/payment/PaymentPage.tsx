import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileImage,
  Loader2,
  ReceiptText,
  UploadCloud,
  WalletCards,
} from 'lucide-react'
import { createMidtransPayment, getOrderPaymentDetails, uploadManualPaymentProof } from '../../api/order.api'
import { Navbar } from '../../components/common/Navbar'
import { useToast } from '../../components/common/toastContext'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import type { CheckoutOrder, OrderStatus } from '../../types/order'

type ErrorResponse = {
  message?: string
  error?: string
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

const MAX_PAYMENT_PROOF_SIZE = 1 * 1024 * 1024
const ALLOWED_PAYMENT_PROOF_TYPES = ['image/jpeg', 'image/png']
const MIDTRANS_SNAP_SCRIPT_ID = 'midtrans-snap-script'
const MIDTRANS_SNAP_SCRIPT_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'

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
    return error.response?.data?.message ?? error.response?.data?.error ?? 'Gagal memproses pembayaran'
  }

  return 'Gagal memproses pembayaran'
}

const getStatusLabel = (status: OrderStatus) => {
  const labels: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'Menunggu Pembayaran',
    WAITING_CONFIRMATION: 'Menunggu Konfirmasi Admin',
    PROCESSING: 'Diproses',
    SHIPPED: 'Dikirim',
    CONFIRMED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  }

  return labels[status]
}

const getUploadUrl = (url: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}${url}`
}

const getRemainingPaymentSeconds = (deadline: string | null) => {
  if (!deadline) return 0

  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

const formatRemainingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const nextSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(nextSeconds).padStart(2, '0')}`
}

const loadMidtransSnapScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.snap) {
      resolve()
      return
    }

    const existingScript = document.getElementById(MIDTRANS_SNAP_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap')), { once: true })
      return
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!clientKey) {
      reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum diisi'))
      return
    }

    const script = document.createElement('script')
    script.id = MIDTRANS_SNAP_SCRIPT_ID
    script.src = MIDTRANS_SNAP_SCRIPT_URL
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'))
    document.body.appendChild(script)
  })

function PaymentPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const [order, setOrder] = useState<CheckoutOrder | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isPayingWithMidtrans, setIsPayingWithMidtrans] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const loadOrder = useCallback(async () => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setError('Order tidak valid')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const nextOrder = await getOrderPaymentDetails(orderId)
      setOrder(nextOrder)
      setRemainingSeconds(getRemainingPaymentSeconds(nextOrder.paymentDeadline))
      setError(null)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadOrder()
    }, 0)

    return () => window.clearTimeout(initialLoadId)
  }, [loadOrder])

  useEffect(() => {
    if (!order?.paymentDeadline || order.status !== 'PENDING_PAYMENT') return

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(getRemainingPaymentSeconds(order.paymentDeadline))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [order?.paymentDeadline, order?.status])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const isManualTransfer = order?.paymentMethod === 'MANUAL_TRANSFER'
  const isGatewayPayment = order?.paymentMethod === 'PAYMENT_GATEWAY'
  const hasUploadedProof = Boolean(order?.paymentProof)
  const isPaymentExpired = isManualTransfer && order?.status === 'PENDING_PAYMENT' && remainingSeconds <= 0
  const canUploadProof =
    isManualTransfer &&
    order?.status === 'PENDING_PAYMENT' &&
    !isPaymentExpired &&
    Boolean(selectedFile) &&
    !isUploading
  const canPayWithMidtrans =
    isGatewayPayment &&
    order?.status === 'PENDING_PAYMENT' &&
    !isPayingWithMidtrans

  const paymentProofUrl = useMemo(() => getUploadUrl(order?.paymentProof ?? null), [order?.paymentProof])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!ALLOWED_PAYMENT_PROOF_TYPES.includes(file.type)) {
      setSelectedFile(null)
      showToast('File harus berupa JPG, JPEG, atau PNG', 'error')
      return
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setSelectedFile(null)
      showToast('Ukuran bukti bayar maksimal 1MB', 'error')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUploadProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || !canUploadProof) return

    setIsUploading(true)
    try {
      const updatedOrder = await uploadManualPaymentProof(orderId, selectedFile)
      setOrder(updatedOrder)
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      showToast('Bukti pembayaran berhasil diupload', 'success')
    } catch (uploadError) {
      showToast(getErrorMessage(uploadError), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePayWithMidtrans = async () => {
    if (!order || !canPayWithMidtrans) return

    setIsPayingWithMidtrans(true)
    try {
      const [{ snapToken }] = await Promise.all([
        createMidtransPayment(order.id),
        loadMidtransSnapScript(),
      ])

      if (!window.snap) {
        throw new Error('Midtrans Snap belum siap')
      }

      window.snap.pay(snapToken, {
        onSuccess: () => {
          showToast('Pembayaran berhasil. Status pesanan sedang diperbarui.', 'success')
          void loadOrder()
        },
        onPending: () => {
          showToast('Pembayaran masih pending. Cek lagi status pesanan nanti.', 'info')
          void loadOrder()
        },
        onError: () => {
          showToast('Pembayaran gagal diproses Midtrans', 'error')
          void loadOrder()
        },
        onClose: () => {
          showToast('Popup pembayaran ditutup sebelum selesai', 'warning')
        },
      })
    } catch (paymentError) {
      showToast(getErrorMessage(paymentError), 'error')
    } finally {
      setIsPayingWithMidtrans(false)
    }
  }

  return (
    <div>
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="payment-page">
        <section className="shell payment-shell">
          <Link to="/checkout" className="button ghost checkout-back-link">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            Kembali ke Checkout
          </Link>

          {isLoading ? (
            <div className="checkout-state-card">
              <Loader2 className="checkout-state-icon spin" aria-hidden="true" />
              <h2>Menyiapkan pembayaran...</h2>
              <p>Kami sedang mengambil detail pesananmu.</p>
            </div>
          ) : error ? (
            <div className="checkout-state-card">
              <AlertCircle className="checkout-state-icon danger" aria-hidden="true" />
              <h2>Payment page belum bisa dibuka</h2>
              <p>{error}</p>
              <button type="button" className="button primary" onClick={() => void loadOrder()}>
                Coba Lagi
              </button>
            </div>
          ) : order ? (
            <>
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">Pembayaran Pesanan</p>
                  <h1>{order.orderNumber}</h1>
                  <p>
                    Selesaikan pembayaran sesuai metode yang dipilih. Untuk transfer manual, upload bukti bayar
                    sebelum deadline berakhir.
                  </p>
                </div>
                <span className={`payment-status payment-status--${order.status.toLowerCase()}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="payment-layout">
                <div className="checkout-main-column">
                  {isManualTransfer && (
                    <section className="checkout-panel payment-manual-panel">
                      <div className="checkout-section-title">
                        <WalletCards aria-hidden="true" />
                        <div>
                          <h2>Upload Bukti Transfer</h2>
                          <p>Upload foto bukti bayar untuk melanjutkan proses pesanan manual transfer.</p>
                        </div>
                      </div>

                      {order.status === 'PENDING_PAYMENT' && (
                        <div className={`payment-deadline-card ${isPaymentExpired ? 'expired' : ''}`}>
                          <Clock3 aria-hidden="true" />
                          <div>
                            <span>Deadline upload bukti bayar</span>
                            <strong>{formatDateTime(order.paymentDeadline)}</strong>
                            <em>{isPaymentExpired ? 'Waktu upload sudah habis' : `${formatRemainingTime(remainingSeconds)} tersisa`}</em>
                          </div>
                        </div>
                      )}

                      {hasUploadedProof ? (
                        <div className="payment-proof-result">
                          <CheckCircle2 aria-hidden="true" />
                          <div>
                            <h3>Bukti bayar sudah diterima</h3>
                            <p>Pesanan sedang menunggu konfirmasi pembayaran dari admin.</p>
                            {paymentProofUrl && (
                              <a href={paymentProofUrl} target="_blank" rel="noreferrer">
                                Lihat bukti bayar
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <form className="payment-upload-form" onSubmit={handleUploadProof}>
                          <label className="payment-upload-dropzone">
                            <UploadCloud aria-hidden="true" />
                            <strong>{selectedFile ? selectedFile.name : 'Pilih file bukti bayar'}</strong>
                            <span>Format JPG, JPEG, atau PNG. Maksimal 1MB.</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                              disabled={isPaymentExpired || isUploading}
                              onChange={handleFileChange}
                            />
                          </label>

                          {previewUrl && (
                            <div className="payment-proof-preview">
                              <img src={previewUrl} alt="Preview bukti bayar" />
                            </div>
                          )}

                          {isPaymentExpired && (
                            <div className="checkout-inline-alert">
                              <AlertCircle aria-hidden="true" />
                              Deadline upload sudah berakhir. Pesanan perlu dibatalkan otomatis oleh sistem.
                            </div>
                          )}

                          <button type="submit" className="button primary payment-upload-button" disabled={!canUploadProof}>
                            {isUploading ? (
                              <>
                                <Loader2 className="button-icon spin" aria-hidden="true" />
                                Mengupload...
                              </>
                            ) : (
                              <>
                                <FileImage className="button-icon" aria-hidden="true" />
                                Upload Bukti Bayar
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </section>
                  )}

                  {isGatewayPayment && (
                    <section className="checkout-panel">
                      <div className="checkout-section-title">
                        <CreditCard aria-hidden="true" />
                        <div>
                          <h2>Payment Gateway Midtrans</h2>
                          <p>Bayar pesanan melalui Midtrans Sandbox. Status final akan mengikuti notifikasi Midtrans.</p>
                        </div>
                      </div>
                      {order.status === 'PENDING_PAYMENT' ? (
                        <div className="payment-gateway-card">
                          <CreditCard aria-hidden="true" />
                          <div>
                            <h3>Midtrans Sandbox</h3>
                            <p>
                              Klik tombol bayar untuk membuka popup Midtrans. Jangan refresh halaman sampai popup
                              pembayaran selesai.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="button primary payment-upload-button"
                            disabled={!canPayWithMidtrans}
                            onClick={handlePayWithMidtrans}
                          >
                            {isPayingWithMidtrans ? (
                              <>
                                <Loader2 className="button-icon spin" aria-hidden="true" />
                                Menyiapkan...
                              </>
                            ) : (
                              <>
                                <CreditCard className="button-icon" aria-hidden="true" />
                                Bayar dengan Midtrans
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="checkout-inline-alert">
                          <CheckCircle2 aria-hidden="true" />
                          Pembayaran gateway sudah tidak berada di status menunggu pembayaran.
                        </div>
                      )}
                    </section>
                  )}

                  <section className="checkout-panel">
                    <div className="checkout-section-title">
                      <ReceiptText aria-hidden="true" />
                      <div>
                        <h2>Ringkasan Produk</h2>
                        <p>Produk yang masuk dalam pesanan ini.</p>
                      </div>
                    </div>

                    <div className="checkout-product-list">
                      {order.items.map((item) => {
                        const image = item.product.images.find((productImage) => productImage.isPrimary) ?? item.product.images[0]

                        return (
                          <div key={item.id} className="checkout-product-item">
                            <div className="checkout-summary-image">
                              {image ? <img src={image.imageUrl} alt={item.product.name} /> : <span>Produk</span>}
                            </div>
                            <div className="checkout-product-info">
                              <strong>{item.product.name}</strong>
                              <span>{item.quantity} x {formatCurrency(item.priceAtTime)}</span>
                            </div>
                            <strong>{formatCurrency(item.subtotal)}</strong>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <aside className="checkout-summary-panel payment-summary-panel">
                  <h2>Rincian Pembayaran</h2>
                  <div className="cart-summary-row">
                    <span>Subtotal Produk</span>
                    <strong>{formatCurrency(order.totalProductAmount)}</strong>
                  </div>
                  <div className="cart-summary-row">
                    <span>Ongkir</span>
                    <strong>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Rp -'}</strong>
                  </div>
                  <div className="cart-summary-row checkout-summary-total">
                    <span>Total Bayar</span>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>
                  <div className="payment-summary-meta">
                    <span>Metode</span>
                    <strong>{isManualTransfer ? 'Transfer Manual' : 'Payment Gateway'}</strong>
                  </div>
                  <div className="payment-summary-meta">
                    <span>Store</span>
                    <strong>{order.store.name}</strong>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </section>
      </main>

      <HomeFooter sections={footerSections} brandName={BRAND.name} />
    </div>
  )
}

export default PaymentPage
