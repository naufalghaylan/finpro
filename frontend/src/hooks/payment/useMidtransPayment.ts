import { useEffect, useRef, useState } from 'react'
import { createMidtransPayment } from '../../api/order.api'
import { useToast } from '../../components/common/toastContext'
import type { CheckoutOrder } from '../../types/order'
import {
  getPaymentErrorMessage,
  loadMidtransSnapScript,
  MIDTRANS_STATUS_POLL_INTERVAL_MS,
  type PaymentSyncMode,
} from './paymentShared'

type UseMidtransPaymentParams = {
  order: CheckoutOrder | null
  embedContainerId: string
  hasReturnParams: boolean
  clearReturnParams: () => void
  syncMidtransOrder: (mode?: PaymentSyncMode) => Promise<CheckoutOrder | null>
}

export function useMidtransPayment({
  order,
  embedContainerId,
  hasReturnParams,
  clearReturnParams,
  syncMidtransOrder,
}: UseMidtransPaymentParams) {
  const [isPayingWithMidtrans, setIsPayingWithMidtrans] = useState(false)
  const [isMidtransPaymentOpen, setIsMidtransPaymentOpen] = useState(false)
  const [midtransEmbedError, setMidtransEmbedError] = useState<string | null>(null)
  const [midtransEmbedRetryKey, setMidtransEmbedRetryKey] = useState(0)
  const midtransEmbedOrderRef = useRef<number | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (!hasReturnParams) return

    const syncTimerId = window.setTimeout(() => {
      void syncMidtransOrder('return').finally(clearReturnParams)
    }, 0)

    return () => window.clearTimeout(syncTimerId)
  }, [clearReturnParams, hasReturnParams, syncMidtransOrder])

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

      const container = document.getElementById(embedContainerId)
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

        const activeContainer = document.getElementById(embedContainerId)
        if (!activeContainer) {
          throw new Error('Container Midtrans belum siap')
        }

        window.snap.hide?.()
        activeContainer.innerHTML = ''
        window.snap.embed(snapToken, {
          embedId: embedContainerId,
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
        setMidtransEmbedError(`${getPaymentErrorMessage(paymentError)}. Coba muat ulang pembayaran Midtrans.`)
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
    embedContainerId,
    midtransEmbedRetryKey,
    order?.id,
    order?.paymentMethod,
    order?.status,
    showToast,
    syncMidtransOrder,
  ])

  const handleRetryMidtransEmbed = () => {
    midtransEmbedOrderRef.current = null
    setMidtransEmbedRetryKey((current) => current + 1)
  }

  return {
    isPayingWithMidtrans,
    isMidtransPaymentOpen,
    midtransEmbedError,
    handleRetryMidtransEmbed,
  }
}
