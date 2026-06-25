import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { cancelOrder, confirmOrderReceived } from '../../api/order.api'
import { useToast } from '../../components/common/toastContext'
import { getPaymentErrorMessage } from './paymentShared'
import { useManualPayment } from './useManualPayment'
import { useMidtransPayment } from './useMidtransPayment'
import { usePaymentOrder } from './usePaymentOrder'

export function usePayment() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const orderId = Number(id)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isConfirmReceiptDialogOpen, setIsConfirmReceiptDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const { showToast } = useToast()

  const {
    order,
    setOrder,
    remainingSeconds,
    isLoading,
    isSyncingWithMidtrans,
    error,
    loadOrder,
    syncMidtransOrder,
  } = usePaymentOrder(orderId)

  const manualPayment = useManualPayment({
    order,
    orderId,
    setOrder,
  })

  const midtransEmbedContainerId = `midtrans-snap-container-${
    Number.isFinite(orderId) && orderId > 0 ? orderId : 'order'
  }`
  const hasMidtransReturnParams = Boolean(
    searchParams.get('order_id') ||
      searchParams.get('status_code') ||
      searchParams.get('transaction_status'),
  )
  const clearMidtransReturnParams = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const midtransPayment = useMidtransPayment({
    order,
    embedContainerId: midtransEmbedContainerId,
    hasReturnParams: hasMidtransReturnParams,
    clearReturnParams: clearMidtransReturnParams,
    syncMidtransOrder,
  })

  const isManualTransfer = order?.paymentMethod === 'MANUAL_TRANSFER'
  const isGatewayPayment = order?.paymentMethod === 'PAYMENT_GATEWAY'
  const hasUploadedProof = Boolean(order?.paymentProof)
  const canCancelOrder =
    order?.status === 'PENDING_PAYMENT' &&
    !hasUploadedProof &&
    !manualPayment.isUploading &&
    !isCancellingOrder &&
    !midtransPayment.isPayingWithMidtrans &&
    !isSyncingWithMidtrans
  const canConfirmReceipt = order?.status === 'SHIPPED'

  const handleCancelOrder = async () => {
    if (!order || !canCancelOrder) return

    setIsCancellingOrder(true)
    try {
      const updatedOrder = await cancelOrder(order.id, cancelReason)
      setOrder(updatedOrder)
      setCancelReason('')
      setIsCancelDialogOpen(false)
      manualPayment.setSelectedFile(null)
      showToast('Pesanan berhasil dibatalkan', 'success')
    } catch (cancelError) {
      showToast(getPaymentErrorMessage(cancelError), 'error')
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!order || order.status !== 'SHIPPED') return

    setIsConfirmingReceipt(true)
    try {
      const updatedOrder = await confirmOrderReceived(order.id)
      setOrder(updatedOrder)
      setIsConfirmReceiptDialogOpen(false)
      showToast('Pesanan berhasil dikonfirmasi selesai', 'success')
    } catch (confirmError) {
      showToast(getPaymentErrorMessage(confirmError), 'error')
    } finally {
      setIsConfirmingReceipt(false)
    }
  }

  return {
    order,
    remainingSeconds,
    isLoading,
    isCancellingOrder,
    isConfirmingReceipt,
    isSyncingWithMidtrans,
    isCancelDialogOpen,
    isConfirmReceiptDialogOpen,
    cancelReason,
    error,
    midtransEmbedContainerId,
    isManualTransfer,
    isGatewayPayment,
    canCancelOrder,
    canConfirmReceipt,
    setIsCancelDialogOpen,
    setIsConfirmReceiptDialogOpen,
    setCancelReason,
    loadOrder,
    handleCancelOrder,
    handleConfirmReceipt,
    ...manualPayment,
    ...midtransPayment,
  }
}
