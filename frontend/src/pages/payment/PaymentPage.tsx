import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import {
  cancelOrder,
  createMidtransPayment,
  getOrderDetails,
  syncMidtransPaymentStatus,
  uploadManualPaymentProof,
} from '../../api/order.api'
import { Navbar } from '../../components/common/Navbar'
import { useToast } from '../../components/common/toastContext'
import { HomeFooter } from '../../components/home/HomeFooter'
import { CancelOrderDialog } from '../../components/orders/CancelOrderDialog'
import { ManualPaymentSection, type ManualPaymentGroup } from '../../components/orders/ManualPaymentSection'
import { OrderProductsPanel } from '../../components/orders/OrderProductsPanel'
import { OrderTrackingTimeline } from '../../components/orders/OrderTrackingTimeline'
import { PaymentGatewaySection } from '../../components/orders/PaymentGatewaySection'
import { PaymentSummaryPanel } from '../../components/orders/PaymentSummaryPanel'
import { getUploadUrl, orderStatusDisplay } from '../../components/orders/orderDisplay'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import type { CheckoutOrder } from '../../types/order'

type ErrorResponse = {
  message?: string
  error?: string
}

type MidtransSnapCallbacks = {
  onSuccess?: (result: unknown) => void
  onPending?: (result: unknown) => void
  onError?: (result: unknown) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap?: {
      embed: (token: string, callbacks: MidtransSnapCallbacks & { embedId: string }) => void
      hide?: () => void
    }
  }
}

const MAX_PAYMENT_PROOF_SIZE = 1 * 1024 * 1024
const ALLOWED_PAYMENT_PROOF_TYPES = ['image/jpeg', 'image/png']
const MIDTRANS_SNAP_SCRIPT_ID = 'midtrans-snap-script'
const MIDTRANS_SNAP_SCRIPT_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'
const MIDTRANS_STATUS_POLL_INTERVAL_MS = 5000

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? 'Gagal memproses pembayaran'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Gagal memproses pembayaran'
}

const getRemainingPaymentSeconds = (deadline: string | null) => {
  if (!deadline) return 0

  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

const hasOrderChanged = (currentOrder: CheckoutOrder | null, nextOrder: CheckoutOrder) => {
  if (!currentOrder) return true

  return (
    currentOrder.id !== nextOrder.id ||
    currentOrder.status !== nextOrder.status ||
    currentOrder.updatedAt !== nextOrder.updatedAt ||
    currentOrder.paymentProof !== nextOrder.paymentProof ||
    currentOrder.paymentGatewayId !== nextOrder.paymentGatewayId ||
    currentOrder.paymentDeadline !== nextOrder.paymentDeadline ||
    currentOrder.shippedAt !== nextOrder.shippedAt ||
    currentOrder.confirmedAt !== nextOrder.confirmedAt ||
    currentOrder.cancelledAt !== nextOrder.cancelledAt ||
    currentOrder.cancelReason !== nextOrder.cancelReason
  )
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
  const [searchParams, setSearchParams] = useSearchParams()
  const orderId = Number(id)
  const [order, setOrder] = useState<CheckoutOrder | null>(null)
  const [activeManualPaymentGroup, setActiveManualPaymentGroup] = useState<ManualPaymentGroup | null>(null)
  const [selectedManualChannelCode, setSelectedManualChannelCode] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [isPayingWithMidtrans, setIsPayingWithMidtrans] = useState(false)
  const [isSyncingWithMidtrans, setIsSyncingWithMidtrans] = useState(false)
  const [isMidtransPaymentOpen, setIsMidtransPaymentOpen] = useState(false)
  const [midtransEmbedError, setMidtransEmbedError] = useState<string | null>(null)
  const [midtransEmbedRetryKey, setMidtransEmbedRetryKey] = useState(0)
  const [hasCopiedManualDestination, setHasCopiedManualDestination] = useState(false)
  const [isPaymentProofExpanded, setIsPaymentProofExpanded] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)
  const midtransEmbedOrderRef = useRef<number | null>(null)
  const midtransSyncInFlightRef = useRef(false)
  const { showToast } = useToast()
  const midtransEmbedContainerId = `midtrans-snap-container-${Number.isFinite(orderId) && orderId > 0 ? orderId : 'order'}`
  const midtransReturnOrderId = searchParams.get('order_id')
  const midtransReturnStatusCode = searchParams.get('status_code')
  const midtransReturnTransactionStatus = searchParams.get('transaction_status')

  const loadOrder = useCallback(async () => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setError('Order tidak valid')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const nextOrder = await getOrderDetails(orderId)
      setOrder(nextOrder)
      setRemainingSeconds(getRemainingPaymentSeconds(nextOrder.paymentDeadline))
      setError(null)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  const syncMidtransOrder = useCallback(
    async (mode: 'silent' | 'success' | 'pending' | 'return' = 'silent') => {
      if (!Number.isFinite(orderId) || orderId <= 0) return null

      const isSilentSync = mode === 'silent'
      if (isSilentSync && midtransSyncInFlightRef.current) return null

      midtransSyncInFlightRef.current = true
      if (!isSilentSync) {
        setIsSyncingWithMidtrans(true)
      }

      try {
        const updatedOrder = await syncMidtransPaymentStatus(orderId)
        setOrder((currentOrder) => (hasOrderChanged(currentOrder, updatedOrder) ? updatedOrder : currentOrder))
        setRemainingSeconds((currentSeconds) => {
          const nextSeconds = getRemainingPaymentSeconds(updatedOrder.paymentDeadline)

          return currentSeconds === nextSeconds ? currentSeconds : nextSeconds
        })
        setError(null)

        if (!isSilentSync) {
          if (updatedOrder.status === 'PROCESSING') {
            showToast('Pembayaran berhasil. Pesanan masuk proses.', 'success')
          } else if (updatedOrder.status === 'PENDING_PAYMENT') {
            showToast('Pembayaran masih menunggu konfirmasi Midtrans.', 'info')
          } else if (updatedOrder.status === 'CANCELLED') {
            showToast('Pembayaran gagal atau expired. Pesanan dibatalkan.', 'error')
          } else {
            showToast('Status pembayaran berhasil diperbarui.', 'success')
          }
        }

        return updatedOrder
      } catch (syncError) {
        if (mode !== 'silent') {
          showToast(getErrorMessage(syncError), 'error')
        }

        return null
      } finally {
        midtransSyncInFlightRef.current = false
        if (!isSilentSync) {
          setIsSyncingWithMidtrans(false)
        }
      }
    },
    [orderId, showToast],
  )

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadOrder()
    }, 0)

    return () => window.clearTimeout(initialLoadId)
  }, [loadOrder])

  useEffect(() => {
    if (!midtransReturnOrderId && !midtransReturnStatusCode && !midtransReturnTransactionStatus) return

    const syncTimerId = window.setTimeout(() => {
      void syncMidtransOrder('return').finally(() => {
        setSearchParams({}, { replace: true })
      })
    }, 0)

    return () => window.clearTimeout(syncTimerId)
  }, [
    midtransReturnOrderId,
    midtransReturnStatusCode,
    midtransReturnTransactionStatus,
    setSearchParams,
    syncMidtransOrder,
  ])

  useEffect(() => {
    if (order?.paymentMethod !== 'PAYMENT_GATEWAY' || order.status !== 'PENDING_PAYMENT') return

    const syncTimerId = window.setTimeout(() => {
      void syncMidtransOrder('silent')
    }, 800)

    const syncIntervalId = window.setInterval(() => {
      if (!document.hidden) {
        void syncMidtransOrder('silent')
      }
    }, MIDTRANS_STATUS_POLL_INTERVAL_MS)

    return () => {
      window.clearTimeout(syncTimerId)
      window.clearInterval(syncIntervalId)
    }
  }, [order?.id, order?.paymentMethod, order?.status, syncMidtransOrder])

  useEffect(() => {
    const currentOrderId = order?.id

    if (!currentOrderId || order?.paymentMethod !== 'PAYMENT_GATEWAY' || order.status !== 'PENDING_PAYMENT') {
      midtransEmbedOrderRef.current = null
      return
    }

    if (midtransEmbedOrderRef.current === currentOrderId) return

    let isCancelled = false

    const renderMidtransEmbed = async () => {
      midtransEmbedOrderRef.current = currentOrderId
      setIsPayingWithMidtrans(true)
      setIsMidtransPaymentOpen(false)
      setMidtransEmbedError(null)

      const container = document.getElementById(midtransEmbedContainerId)
      if (container) {
        container.innerHTML = ''
      }

      try {
        const [{ snapToken }] = await Promise.all([
          createMidtransPayment(currentOrderId),
          loadMidtransSnapScript(),
        ])

        if (isCancelled) return

        if (!window.snap?.embed) {
          throw new Error('Midtrans Snap embed belum siap')
        }

        const activeContainer = document.getElementById(midtransEmbedContainerId)
        if (!activeContainer) {
          throw new Error('Container Midtrans belum siap')
        }

        window.snap.hide?.()
        activeContainer.innerHTML = ''
        window.snap.embed(snapToken, {
          embedId: midtransEmbedContainerId,
          onSuccess: () => {
            void syncMidtransOrder('success').finally(() => {
              setIsMidtransPaymentOpen(false)
            })
          },
          onPending: () => {
            void syncMidtransOrder('pending')
          },
          onError: () => {
            showToast('Pembayaran gagal diproses Midtrans', 'error')
            void syncMidtransOrder('pending').finally(() => {
              setIsMidtransPaymentOpen(false)
            })
          },
          onClose: () => {
            setIsMidtransPaymentOpen(false)
            showToast('Pembayaran Midtrans ditutup sebelum selesai', 'warning')
          },
        })
        setIsMidtransPaymentOpen(true)
      } catch (paymentError) {
        if (isCancelled) return

        midtransEmbedOrderRef.current = null
        setMidtransEmbedError(`${getErrorMessage(paymentError)}. Coba muat ulang pembayaran Midtrans.`)
        showToast('Gagal memuat pembayaran Midtrans', 'error')
      } finally {
        if (!isCancelled) {
          setIsPayingWithMidtrans(false)
        }
      }
    }

    const embedTimerId = window.setTimeout(() => {
      void renderMidtransEmbed()
    }, 0)

    return () => {
      isCancelled = true
      window.clearTimeout(embedTimerId)
    }
  }, [
    midtransEmbedContainerId,
    midtransEmbedRetryKey,
    order?.id,
    order?.paymentMethod,
    order?.status,
    showToast,
    syncMidtransOrder,
  ])

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

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [previewUrl])

  const isManualTransfer = order?.paymentMethod === 'MANUAL_TRANSFER'
  const isGatewayPayment = order?.paymentMethod === 'PAYMENT_GATEWAY'
  const hasUploadedProof = Boolean(order?.paymentProof)
  const paymentProofUrl = useMemo(() => getUploadUrl(order?.paymentProof ?? null), [order?.paymentProof])
  const canCancelOrder =
    order?.status === 'PENDING_PAYMENT' &&
    !hasUploadedProof &&
    !isUploading &&
    !isCancellingOrder &&
    !isPayingWithMidtrans &&
    !isSyncingWithMidtrans

  const handleCopyPaymentDestination = async (destinationValue: string) => {
    try {
      await navigator.clipboard.writeText(destinationValue)
      setHasCopiedManualDestination(true)
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setHasCopiedManualDestination(false)
        copyResetTimeoutRef.current = null
      }, 1800)
      showToast('Nomor tujuan pembayaran berhasil disalin', 'success')
    } catch {
      showToast('Gagal menyalin nomor tujuan pembayaran', 'error')
    }
  }

  const handleManualPaymentTabChange = (group: ManualPaymentGroup) => {
    setActiveManualPaymentGroup(group)
    setHasCopiedManualDestination(false)

    setSelectedManualChannelCode(group === 'qris' ? 'qris-manual' : '')
  }

  const handleManualPaymentChannelChange = (channelCode: string) => {
    setSelectedManualChannelCode(channelCode)
    setHasCopiedManualDestination(false)
  }

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
      event.target.value = ''
      showToast('File harus berupa JPG, JPEG, atau PNG', 'error')
      return
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setSelectedFile(null)
      event.target.value = ''
      showToast('Ukuran bukti bayar maksimal 1MB', 'error')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUploadProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!order || !selectedFile || order.status !== 'PENDING_PAYMENT' || !selectedManualChannelCode) return

    setIsUploading(true)
    try {
      const updatedOrder = await uploadManualPaymentProof(orderId, selectedFile)
      setOrder(updatedOrder)
      setSelectedFile(null)
      setIsPaymentProofExpanded(false)
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

  const handleCancelOrder = async () => {
    if (!order || !canCancelOrder) return

    setIsCancellingOrder(true)
    try {
      const updatedOrder = await cancelOrder(order.id, cancelReason)
      setOrder(updatedOrder)
      setCancelReason('')
      setIsCancelDialogOpen(false)
      setSelectedFile(null)
      showToast('Pesanan berhasil dibatalkan', 'success')
    } catch (cancelError) {
      showToast(getErrorMessage(cancelError), 'error')
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const handleRetryMidtransEmbed = () => {
    midtransEmbedOrderRef.current = null
    setMidtransEmbedRetryKey((current) => current + 1)
  }

  return (
    <div>
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="payment-page">
        <section className="shell payment-shell">
          <Link to="/orders" className="button ghost checkout-back-link">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            Kembali ke Pesanan
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
              <h2>Detail pesanan belum bisa dibuka</h2>
              <p>{error}</p>
              <button type="button" className="button primary" onClick={() => void loadOrder()}>
                Coba Lagi
              </button>
            </div>
          ) : order ? (
            <>
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">Detail Pesanan</p>
                  <h1>{order.orderNumber}</h1>
                  <p>
                    {order.status === 'PENDING_PAYMENT'
                      ? 'Selesaikan pembayaran sesuai metode yang dipilih agar pesanan bisa diproses.'
                      : 'Pantau status pesanan, rincian pembayaran, dan produk yang sudah kamu checkout.'}
                  </p>
                </div>
                <span className={`payment-status payment-status--${order.status.toLowerCase()}`}>
                  {orderStatusDisplay[order.status].label}
                </span>
              </div>

              <div className="payment-layout">
                <div className="checkout-main-column">
                  <OrderTrackingTimeline order={order} />

                  {isManualTransfer && (
                    <ManualPaymentSection
                      order={order}
                      activeGroup={activeManualPaymentGroup}
                      selectedChannelCode={selectedManualChannelCode}
                      selectedFile={selectedFile}
                      previewUrl={previewUrl}
                      paymentProofUrl={paymentProofUrl}
                      remainingSeconds={remainingSeconds}
                      isUploading={isUploading}
                      hasCopiedDestination={hasCopiedManualDestination}
                      isProofExpanded={isPaymentProofExpanded}
                      onGroupChange={handleManualPaymentTabChange}
                      onChannelChange={handleManualPaymentChannelChange}
                      onCopyDestination={(destinationValue) => void handleCopyPaymentDestination(destinationValue)}
                      onFileChange={handleFileChange}
                      onUploadProof={handleUploadProof}
                      onToggleProofExpanded={() => setIsPaymentProofExpanded((current) => !current)}
                    />
                  )}

                  {isGatewayPayment && (
                    <PaymentGatewaySection
                      order={order}
                      embedContainerId={midtransEmbedContainerId}
                      isPreparing={isPayingWithMidtrans}
                      isEmbedReady={isMidtransPaymentOpen}
                      errorMessage={midtransEmbedError}
                      onRetry={handleRetryMidtransEmbed}
                    />
                  )}

                  <OrderProductsPanel order={order} />
                </div>

                <PaymentSummaryPanel
                  order={order}
                  isManualTransfer={Boolean(isManualTransfer)}
                  canCancel={Boolean(canCancelOrder)}
                  isCancelling={isCancellingOrder}
                  onCancelClick={() => setIsCancelDialogOpen(true)}
                />
              </div>
            </>
          ) : null}
        </section>
      </main>

      <CancelOrderDialog
        isOpen={isCancelDialogOpen}
        orderNumber={order?.orderNumber}
        reason={cancelReason}
        isSubmitting={isCancellingOrder}
        onReasonChange={setCancelReason}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => void handleCancelOrder()}
      />

      <HomeFooter sections={footerSections} brandName={BRAND.name} />
    </div>
  )
}

export default PaymentPage
