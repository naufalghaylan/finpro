import { useState } from 'react'
import {
  approveOrderFulfillment,
  receiveOrderFulfillment,
  rejectOrderFulfillment,
  requestOrderFulfillments,
} from '../../api/order.api'
import { useToast } from '../../components/common/Toast'
import { useAuthStore } from '../../store/authStore'
import type {
  AdminOrder,
  FulfillmentRequirement,
} from '../../types/order'
import {
  createFulfillmentRequests,
  createRequestDrafts,
  isFulfillmentDraftValid,
  type FulfillmentDraft,
} from './adminFulfillmentDraft'
import {
  createApproveFulfillmentConfirmation,
  createReceiveFulfillmentConfirmation,
  type FulfillmentConfirmation,
} from './adminFulfillmentConfirmation'
import { useAdminFulfillmentActions } from './useAdminFulfillmentActions'

export type { FulfillmentConfirmation } from './adminFulfillmentConfirmation'

type UseAdminOrderFulfillmentParams = {
  order: AdminOrder
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

export function useAdminOrderFulfillment({ order, onClose, onUpdated }: UseAdminOrderFulfillmentParams) {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const requestRequirements = order.stockFulfillment.requirements.filter(
    (requirement) => requirement.remainingQuantity > 0,
  )
  const [requestDrafts, setRequestDrafts] = useState<Record<number, FulfillmentDraft>>(
    () => createRequestDrafts(requestRequirements),
  )
  const [actionNotes, setActionNotes] = useState('')
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [isClosingDisabled, setIsClosingDisabled] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<FulfillmentConfirmation | null>(null)
  const { runAction } = useAdminFulfillmentActions({
    onClose,
    onUpdated,
    setSubmittingKey,
    setIsClosingDisabled,
    setPendingConfirmation,
  })

  const canActForStore = (storeId: number) => (
    user?.role === 'SUPER_ADMIN' || user?.storeId === storeId
  )

  const updateDraft = (productId: number, changes: Partial<FulfillmentDraft>) => {
    setRequestDrafts((currentDrafts) => ({
      ...currentDrafts,
      [productId]: {
        ...currentDrafts[productId],
        ...changes,
      },
    }))
  }

  const handleSourceStoreChange = (requirement: FulfillmentRequirement, storeId: number | '') => {
    const source = requirement.sources.find((option) => option.storeId === storeId)
    updateDraft(requirement.productId, {
      sourceStoreId: storeId,
      quantity: source
        ? Math.min(requirement.remainingQuantity, source.availableQuantity)
        : requirement.remainingQuantity,
    })
  }

  const canSubmitRequests = (
    requestRequirements.length > 0 &&
    requestRequirements.every((requirement) => (
      isFulfillmentDraftValid(requirement, requestDrafts[requirement.productId])
    ))
  )
  const totalRequestQuantity = requestRequirements.reduce(
    (total, requirement) => total + (requestDrafts[requirement.productId]?.quantity ?? 0),
    0,
  )

  const handleRequestFulfillments = async () => {
    if (!canSubmitRequests) {
      showToast('Lengkapi toko sumber dan jumlah untuk seluruh produk', 'error')
      return
    }

    const requests = createFulfillmentRequests(requestRequirements, requestDrafts)
    await runAction(
      'request-batch',
      () => requestOrderFulfillments(order.id, requests),
      `${requests.length} permintaan mutasi stok berhasil dibuat`,
    )
  }

  const handleApproveFulfillment = (mutationId: number) => {
    setPendingConfirmation(createApproveFulfillmentConfirmation(order, mutationId))
  }

  const handleRejectFulfillment = (mutationId: number) => {
    void runAction(
      `reject-${mutationId}`,
      () => rejectOrderFulfillment(mutationId, actionNotes),
      'Permintaan mutasi stok ditolak',
    )
  }

  const handleReceiveFulfillment = (mutationId: number) => {
    setPendingConfirmation(createReceiveFulfillmentConfirmation(order, mutationId))
  }

  const handleConfirmFulfillmentAction = () => {
    if (!pendingConfirmation) return

    if (pendingConfirmation.type === 'approve') {
      void runAction(
        `approve-${pendingConfirmation.mutationId}`,
        () => approveOrderFulfillment(pendingConfirmation.mutationId, actionNotes, true),
        'Mutasi stok disetujui dan barang dikirim',
      )
      return
    }

    void runAction(
      `receive-${pendingConfirmation.mutationId}`,
      () => receiveOrderFulfillment(pendingConfirmation.mutationId, actionNotes, true),
      'Barang mutasi diterima di toko tujuan',
    )
  }

  const clearPendingConfirmation = () => {
    if (submittingKey) return
    setPendingConfirmation(null)
  }

  const handleClose = () => {
    if (isClosingDisabled) return
    onClose()
  }

  return {
    requestRequirements,
    requestDrafts,
    updateDraft,
    handleSourceStoreChange,
    canSubmitRequests,
    totalRequestQuantity,
    actionNotes,
    setActionNotes,
    submittingKey,
    isClosingDisabled,
    pendingConfirmation,
    clearPendingConfirmation,
    handleConfirmFulfillmentAction,
    canActForStore,
    handleRequestFulfillments,
    handleApproveFulfillment,
    handleRejectFulfillment,
    handleReceiveFulfillment,
    handleClose,
  }
}
