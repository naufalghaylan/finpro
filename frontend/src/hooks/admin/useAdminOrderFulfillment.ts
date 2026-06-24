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
import { getApiErrorMessage } from '../../utils/apiError'

type FulfillmentDraft = {
  sourceStoreId: number | ''
  quantity: number
  notes: string
}

export type FulfillmentConfirmation = {
  type: 'approve' | 'receive'
  mutationId: number
  title: string
  message: string
  confirmLabel: string
  tone: 'success' | 'info'
}

type UseAdminOrderFulfillmentParams = {
  order: AdminOrder
  onClose: () => void
  onUpdated: () => Promise<void> | void
}

const createRequestDrafts = (requirements: FulfillmentRequirement[]) => Object.fromEntries(
  requirements
    .filter((requirement) => requirement.remainingQuantity > 0)
    .map((requirement) => [
      requirement.productId,
      {
        sourceStoreId: '' as const,
        quantity: requirement.remainingQuantity,
        notes: '',
      },
    ]),
) as Record<number, FulfillmentDraft>

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

  const isDraftValid = (requirement: FulfillmentRequirement) => {
    const draft = requestDrafts[requirement.productId]
    if (!draft || !draft.sourceStoreId || draft.quantity < 1) return false

    const source = requirement.sources.find((option) => option.storeId === draft.sourceStoreId)
    return Boolean(
      source &&
      draft.quantity <= requirement.remainingQuantity &&
      draft.quantity <= source.availableQuantity,
    )
  }

  const canSubmitRequests = (
    requestRequirements.length > 0 &&
    requestRequirements.every(isDraftValid)
  )
  const totalRequestQuantity = requestRequirements.reduce(
    (total, requirement) => total + (requestDrafts[requirement.productId]?.quantity ?? 0),
    0,
  )

  const runAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
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
      showToast(getApiErrorMessage(error, 'Gagal memproses mutasi stok'), 'error')
    } finally {
      setSubmittingKey(null)
      setIsClosingDisabled(false)
      setPendingConfirmation(null)
    }
  }

  const handleRequestFulfillments = async () => {
    if (!canSubmitRequests) {
      showToast('Lengkapi toko sumber dan jumlah untuk seluruh produk', 'error')
      return
    }

    const requests = requestRequirements.map((requirement) => {
      const draft = requestDrafts[requirement.productId]
      return {
        sourceStoreId: Number(draft.sourceStoreId),
        productId: requirement.productId,
        quantity: Math.floor(draft.quantity),
        notes: draft.notes.trim() || undefined,
      }
    })

    await runAction(
      'request-batch',
      () => requestOrderFulfillments(order.id, requests),
      `${requests.length} permintaan mutasi stok berhasil dibuat`,
    )
  }

  const handleApproveFulfillment = (mutationId: number) => {
    const mutation = order.stockMutations.find((item) => item.id === mutationId)
    setPendingConfirmation({
      type: 'approve',
      mutationId,
      title: 'Setujui mutasi stok?',
      message: mutation
        ? `Pastikan ${mutation.quantity} ${mutation.product.name} siap dikirim dari ${mutation.sourceStore.name} ke ${mutation.destinationStore.name}.`
        : 'Pastikan jumlah dan kondisi stok siap dikirim ke toko tujuan.',
      confirmLabel: 'Setujui & Kirim',
      tone: 'success',
    })
  }

  const handleRejectFulfillment = (mutationId: number) => {
    void runAction(
      `reject-${mutationId}`,
      () => rejectOrderFulfillment(mutationId, actionNotes),
      'Permintaan mutasi stok ditolak',
    )
  }

  const handleReceiveFulfillment = (mutationId: number) => {
    const mutation = order.stockMutations.find((item) => item.id === mutationId)
    setPendingConfirmation({
      type: 'receive',
      mutationId,
      title: 'Barang mutasi sudah diterima?',
      message: mutation
        ? `Konfirmasi jika ${mutation.quantity} ${mutation.product.name} sudah tiba dan diperiksa di ${mutation.destinationStore.name}.`
        : 'Konfirmasi hanya jika barang sudah benar-benar tiba dan diperiksa di gudang tujuan.',
      confirmLabel: 'Terima Barang',
      tone: 'info',
    })
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
