import { useEffect, useMemo, useState } from 'react'
import {
  approveOrderFulfillment,
  approveOrderFulfillments,
  getStoreFulfillments,
  receiveOrderFulfillment,
  receiveOrderFulfillments,
  rejectOrderFulfillment,
  rejectOrderFulfillments,
} from '../../api/order.api'
import {
  groupStoreFulfillments,
  type FulfillmentAction,
  type StoreFulfillmentGroup,
} from '../../components/admin/orders/storeFulfillmentGroup'
import { useToast } from '../../components/common/Toast'
import type {
  FulfillmentDirection,
  MutationStatus,
  OrderFulfillmentMutation,
  OrderListMeta,
} from '../../types/order'
import { getApiErrorMessage, getApiFetchError, type ApiFetchError } from '../../utils/apiError'

type Params = {
  storeId: number
}

export type AdminStoreFulfillmentActionTarget = {
  action: FulfillmentAction
  mutations: OrderFulfillmentMutation[]
}

const emptyMeta: OrderListMeta = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

export function useAdminStoreFulfillmentPage({ storeId }: Params) {
  const { showToast } = useToast()
  const [fulfillments, setFulfillments] = useState<OrderFulfillmentMutation[]>([])
  const [meta, setMeta] = useState<OrderListMeta>(emptyMeta)
  const [direction, setDirection] = useState<FulfillmentDirection>('all')
  const [status, setStatus] = useState<MutationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionTarget, setActionTarget] = useState<AdminStoreFulfillmentActionTarget | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [approvedQuantity, setApprovedQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [actionShouldClose, setActionShouldClose] = useState(false)
  const [detailGroup, setDetailGroup] = useState<StoreFulfillmentGroup | null>(null)
  const [, setFetchError] = useState<ApiFetchError | null>(null)
  const groups = useMemo(() => groupStoreFulfillments(fulfillments), [fulfillments])

  const fetchFulfillments = async () => {
    try {
      setLoading(true)
      const result = await getStoreFulfillments({
        storeId,
        page,
        limit: 50,
        direction,
        status: status || undefined,
        search: search.trim() || undefined,
      })
      setFulfillments(result.fulfillments)
      setMeta(result.meta)
      setFetchError(null)
    } catch (error) {
      const nextError = getApiFetchError(error, 'Gagal memuat daftar mutasi stok')
      setFetchError(nextError)
      showToast(nextError.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchFulfillments(), search ? 350 : 0)
    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page, direction, status, search])

  const openAction = (action: FulfillmentAction, mutations: OrderFulfillmentMutation[]) => {
    setActionTarget({ action, mutations })
    setActionNotes('')
    setConfirmed(false)
    setActionShouldClose(false)
    setApprovedQuantity(action === 'approve' && mutations.length === 1 ? mutations[0].quantity : 1)
  }

  const closeAction = () => {
    if (submitting) return
    setActionTarget(null)
    setActionNotes('')
    setConfirmed(false)
    setActionShouldClose(false)
    setApprovedQuantity(1)
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { action, mutations } = actionTarget
    if (action !== 'reject' && !confirmed) return

    const mutationIds = mutations.map((mutation) => mutation.id)
    const isBatch = mutationIds.length > 1

    try {
      setSubmitting(true)
      if (action === 'approve') {
        if (isBatch) await approveOrderFulfillments(mutationIds, actionNotes, true)
        else await approveOrderFulfillment(mutationIds[0], actionNotes, true, approvedQuantity)
        showToast(
          isBatch
            ? `${mutationIds.length} produk dicatat siap dan dalam perjalanan`
            : `${approvedQuantity} item dicatat siap dan dalam perjalanan`,
          'success',
        )
      } else if (action === 'receive') {
        if (isBatch) await receiveOrderFulfillments(mutationIds, actionNotes, true)
        else await receiveOrderFulfillment(mutationIds[0], actionNotes, true)
        showToast(`${mutationIds.length} produk diterima dan pesanan siap dilanjutkan`, 'success')
      } else {
        if (isBatch) await rejectOrderFulfillments(mutationIds, actionNotes)
        else await rejectOrderFulfillment(mutationIds[0], actionNotes)
        showToast(`${mutationIds.length} permintaan mutasi stok ditolak`, 'success')
      }
      setActionNotes('')
      setConfirmed(false)
      setApprovedQuantity(1)
      await fetchFulfillments()
      setActionShouldClose(true)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal memproses mutasi stok'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDirectionChange = (nextDirection: FulfillmentDirection) => {
    setDirection(nextDirection)
    setPage(1)
  }

  const handleStatusChange = (nextStatus: MutationStatus | '') => {
    setStatus(nextStatus)
    setPage(1)
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(1)
  }

  return {
    groups,
    meta,
    direction,
    status,
    search,
    loading,
    actionTarget,
    actionNotes,
    confirmed,
    approvedQuantity,
    submitting,
    actionShouldClose,
    detailGroup,
    openAction,
    closeAction,
    handleAction,
    handleDirectionChange,
    handleStatusChange,
    handleSearchChange,
    goToPreviousPage: () => setPage((current) => current - 1),
    goToNextPage: () => setPage((current) => current + 1),
    setActionNotes,
    setConfirmed,
    setApprovedQuantity,
    setDetailGroup,
  }
}
