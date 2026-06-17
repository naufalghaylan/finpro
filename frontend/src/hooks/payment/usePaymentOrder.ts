import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrderDetails, syncMidtransPaymentStatus } from '../../api/order.api'
import { useToast } from '../../components/common/toastContext'
import type { CheckoutOrder } from '../../types/order'
import {
  getPaymentErrorMessage,
  getRemainingPaymentSeconds,
  hasOrderChanged,
  type PaymentSyncMode,
} from './paymentShared'

export function usePaymentOrder(orderId: number) {
  const [order, setOrder] = useState<CheckoutOrder | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncingWithMidtrans, setIsSyncingWithMidtrans] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const midtransSyncInFlightRef = useRef(false)
  const { showToast } = useToast()

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
      setError(getPaymentErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  const syncMidtransOrder = useCallback(
    async (mode: PaymentSyncMode = 'silent') => {
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
          showToast(getPaymentErrorMessage(syncError), 'error')
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
    if (!order?.paymentDeadline || order.status !== 'PENDING_PAYMENT') return

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(getRemainingPaymentSeconds(order.paymentDeadline))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [order?.paymentDeadline, order?.status])

  return {
    order,
    setOrder,
    remainingSeconds,
    isLoading,
    isSyncingWithMidtrans,
    error,
    loadOrder,
    syncMidtransOrder,
  }
}
