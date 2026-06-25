import { useCallback, useEffect, useState } from 'react'
import { adminCancelOrder, confirmManualPayment, getAdminOrders, shipAdminOrder } from '../../api/order.api'
import { getStores } from '../../api/store'
import { useToast } from '../../components/common/Toast'
import { useAuthStore } from '../../store/authStore'
import type { AdminOrder, OrderListMeta, OrderStatus } from '../../types/order'
import type { Store } from '../../types/store'
import { getApiErrorMessage } from '../../utils/apiError'

const PAGE_LIMIT = 10

type PaymentConfirmationAction = 'approve' | 'reject'

const emptyMeta: OrderListMeta = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

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
  
  // Modals state
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
    // Avoid synchronous state updates inside useEffect
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
    } catch (e) {
      showToast(getApiErrorMessage(e, 'Gagal memuat pesanan'), 'error')
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

    getStores(1, 100)
      .then((response) => setStores(response.data))
      .catch(() => setStores([]))
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
    fetchOrders,
  }
}
