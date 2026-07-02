import { useCallback, useEffect, useState } from 'react'
import { adminCancelOrder, confirmManualPayment, getAdminOrders, shipAdminOrder } from '../../api/order.api'
import { useToast } from '../../components/common/Toast'
import { useAuthStore } from '../../store/authStore'
import type { AdminOrder, OrderListMeta, OrderStatus } from '../../types/order'
import type { Store } from '../../types/store'
import { getApiErrorMessage, getApiFetchError, type ApiFetchError } from '../../utils/apiError'
import { emptyMeta, loadAdminOrderStores, PAGE_LIMIT, type PaymentConfirmationAction } from './adminOrderList.shared'

export function useAdminOrderList(storeId?: number) {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<OrderListMeta>(emptyMeta)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [selectedFilterStoreId, setSelectedFilterStoreId] = useState<number | ''>('')
  const [fetchError, setFetchError] = useState<ApiFetchError | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [pendingAction, setPendingAction] = useState<PaymentConfirmationAction | null>(null)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [paymentReviewShouldClose, setPaymentReviewShouldClose] = useState(false)
  const [cancelOrderTarget, setCancelOrderTarget] = useState<AdminOrder | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [cancelDialogShouldClose, setCancelDialogShouldClose] = useState(false)
  const [fulfillmentOrder, setFulfillmentOrder] = useState<AdminOrder | null>(null)
  const [shipOrderTarget, setShipOrderTarget] = useState<AdminOrder | null>(null)
  const [isShippingOrder, setIsShippingOrder] = useState(false)
  const [shipDialogShouldClose, setShipDialogShouldClose] = useState(false)

  const showStoreFilter = !storeId && user?.role === 'SUPER_ADMIN'

  const fetchOrders = useCallback(async () => {
    await Promise.resolve()

    try {
      setLoading(true)
      const activeStoreId = storeId || (selectedFilterStoreId ? Number(selectedFilterStoreId) : undefined)
      const result = await getAdminOrders({
        page,
        limit: PAGE_LIMIT,
        storeId: activeStoreId,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })

      setOrders(result.orders)
      setMeta(result.meta)
      setFetchError(null)
    } catch (e) {
      const nextError = getApiFetchError(e, 'Gagal memuat pesanan')
      setFetchError(nextError)
      showToast(nextError.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedFilterStoreId, statusFilter, storeId, showToast])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchOrders(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchOrders])

  useEffect(() => {
    if (!showStoreFilter) return

    void loadAdminOrderStores().then((nextStores) => setStores(nextStores))
  }, [showStoreFilter])

  const handleConfirmManualPayment = async () => {
    if (!selectedOrder || !pendingAction) return

    try {
      setIsConfirmingPayment(true)
      await confirmManualPayment(selectedOrder.id, pendingAction)
      setPendingAction(null)
      showToast(
        pendingAction === 'approve'
          ? 'Pembayaran manual berhasil diterima'
          : 'Bukti bayar ditolak. User bisa upload ulang bukti pembayaran.',
        'success',
      )
      await fetchOrders()
      setPaymentReviewShouldClose(true)
    } catch (e) {
      showToast(getApiErrorMessage(e, 'Gagal memproses konfirmasi pembayaran'), 'error')
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const closePaymentReview = () => {
    if (isConfirmingPayment) return
    setSelectedOrder(null)
    setPendingAction(null)
    setPaymentReviewShouldClose(false)
  }

  const handleAdminCancelOrder = async () => {
    if (!cancelOrderTarget) return

    try {
      setIsCancellingOrder(true)
      await adminCancelOrder(cancelOrderTarget.id, cancelReason)
      showToast('Pesanan berhasil dibatalkan dan stok dikembalikan', 'success')
      setCancelReason('')
      await fetchOrders()
      setCancelDialogShouldClose(true)
    } catch (e) {
      showToast(getApiErrorMessage(e, 'Gagal membatalkan pesanan'), 'error')
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const closeCancelDialog = () => {
    if (isCancellingOrder) return
    setCancelOrderTarget(null)
    setCancelReason('')
    setCancelDialogShouldClose(false)
  }

  const handleShipOrder = async () => {
    if (!shipOrderTarget) return

    try {
      setIsShippingOrder(true)
      await shipAdminOrder(shipOrderTarget.id)
      showToast('Pesanan berhasil ditandai sedang dikirim', 'success')
      await fetchOrders()
      setShipDialogShouldClose(true)
    } catch (e) {
      showToast(getApiErrorMessage(e, 'Gagal mengirim pesanan'), 'error')
    } finally {
      setIsShippingOrder(false)
    }
  }

  const closeShipDialog = () => {
    if (isShippingOrder) return
    setShipOrderTarget(null)
    setShipDialogShouldClose(false)
  }

  return {
    orders,
    stores,
    loading,
    search,
    page,
    meta,
    statusFilter,
    selectedFilterStoreId,
    showStoreFilter,
    setSearch,
    setPage,
    setStatusFilter,
    setSelectedFilterStoreId,
    selectedOrder,
    pendingAction,
    isConfirmingPayment,
    paymentReviewShouldClose,
    setSelectedOrder,
    setPendingAction,
    handleConfirmManualPayment,
    closePaymentReview,
    cancelOrderTarget,
    cancelReason,
    isCancellingOrder,
    cancelDialogShouldClose,
    setCancelOrderTarget,
    setCancelReason,
    handleAdminCancelOrder,
    closeCancelDialog,
    fulfillmentOrder,
    setFulfillmentOrder,
    shipOrderTarget,
    isShippingOrder,
    shipDialogShouldClose,
    setShipOrderTarget,
    handleShipOrder,
    closeShipDialog,
    fetchError,
    fetchOrders,
  }
}