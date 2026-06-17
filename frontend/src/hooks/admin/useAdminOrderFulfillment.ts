import { useEffect, useMemo, useState } from 'react'
import {
  approveOrderFulfillment,
  receiveOrderFulfillment,
  rejectOrderFulfillment,
  requestOrderFulfillment,
} from '../../api/order.api'
import { getPublicStores } from '../../api/store'
import { useToast } from '../../components/common/Toast'
import { useAuthStore } from '../../store/authStore'
import type { AdminOrder, OrderFulfillmentMutation } from '../../types/order'
import type { Store } from '../../types/store'
import { getApiErrorMessage } from '../../utils/apiError'

const getErrorMessage = (error: unknown, fallback: string) => getApiErrorMessage(error, fallback)

type UseAdminOrderFulfillmentParams = {
  order: AdminOrder
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

export function useAdminOrderFulfillment({ order, onClose, onUpdated }: UseAdminOrderFulfillmentParams) {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const firstOrderItem = order.items[0]

  const [stores, setStores] = useState<Store[]>([])
  const [selectedProductId, setSelectedProductId] = useState(firstOrderItem?.product.id ?? 0)
  
  const selectedOrderItem = useMemo(
    () => order.items.find((item) => item.product.id === selectedProductId) ?? firstOrderItem,
    [firstOrderItem, order.items, selectedProductId],
  )
  
  const [sourceStoreId, setSourceStoreId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(selectedOrderItem?.quantity ?? 1)
  const [notes, setNotes] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [isLoadingStores, setIsLoadingStores] = useState(true)
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [isClosingDisabled, setIsClosingDisabled] = useState(false)

  const sourceStoreOptions = stores.filter((store) => store.id !== order.store.id)
  const canActForStore = (storeId: number) => user?.role === 'SUPER_ADMIN' || user?.storeId === storeId

  useEffect(() => {
    let timeoutId = window.setTimeout(() => { setIsLoadingStores(true) }, 0)
    getPublicStores(1, 100)
      .then((response) => setStores(response.data))
      .catch(() => setStores([]))
      .finally(() => setIsLoadingStores(false))
      
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!selectedOrderItem) return
    let timeoutId = window.setTimeout(() => { setQuantity(selectedOrderItem.quantity) }, 0)
    return () => clearTimeout(timeoutId)
  }, [selectedOrderItem])

  const runAction = async (
    actionKey: string,
    action: () => Promise<OrderFulfillmentMutation>,
    successMessage: string,
  ) => {
    try {
      setSubmittingKey(actionKey)
      setIsClosingDisabled(true)
      await action()
      showToast(successMessage, 'success')
      await onUpdated()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error, 'Gagal memproses fulfillment'), 'error')
    } finally {
      setSubmittingKey(null)
      setIsClosingDisabled(false)
    }
  }

  const handleRequestFulfillment = async () => {
    if (!selectedOrderItem || !sourceStoreId) {
      showToast('Pilih produk dan source store terlebih dahulu', 'error')
      return
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity))

    await runAction(
      'request',
      () => requestOrderFulfillment(order.id, {
        sourceStoreId: Number(sourceStoreId),
        productId: selectedOrderItem.product.id,
        quantity: normalizedQuantity,
        notes: notes.trim() || undefined,
      }),
      'Request fulfillment berhasil dibuat',
    )
  }

  const handleApproveFulfillment = (mutationId: number) => {
    void runAction(
      `approve-${mutationId}`,
      () => approveOrderFulfillment(mutationId, actionNotes),
      'Fulfillment disetujui dan stok dikirim',
    )
  }

  const handleRejectFulfillment = (mutationId: number) => {
    void runAction(
      `reject-${mutationId}`,
      () => rejectOrderFulfillment(mutationId, actionNotes),
      'Fulfillment ditolak',
    )
  }

  const handleReceiveFulfillment = (mutationId: number) => {
    void runAction(
      `receive-${mutationId}`,
      () => receiveOrderFulfillment(mutationId, actionNotes),
      'Fulfillment diterima di toko tujuan',
    )
  }

  const handleClose = () => {
    if (isClosingDisabled) return
    onClose()
  }

  return {
    selectedProductId,
    setSelectedProductId,
    selectedOrderItem,
    sourceStoreId,
    setSourceStoreId,
    quantity,
    setQuantity,
    notes,
    setNotes,
    actionNotes,
    setActionNotes,
    isLoadingStores,
    submittingKey,
    isClosingDisabled,
    sourceStoreOptions,
    canActForStore,
    handleRequestFulfillment,
    handleApproveFulfillment,
    handleRejectFulfillment,
    handleReceiveFulfillment,
    handleClose,
  }
}
