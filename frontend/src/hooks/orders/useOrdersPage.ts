import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOrders } from '../../api/order.api'
import { getOrderItemQuantity } from '../../components/orders/orderDisplay'
import type { CheckoutOrder, OrderListMeta } from '../../types/order'
import { getApiFetchError, type ApiFetchError } from '../../utils/apiError'
import {
  getAppliedOrderFilterParams,
  getClearedOrderFilterParams,
  getDebouncedSearchParams,
  getOrderPageParams,
  getOrderStatusGroupParams,
  getPositivePage,
  getSearchValue,
  isOrderStatusGroup,
  type OrderStatusTab,
} from './orderListParams'

export type { OrderStatusTab } from './orderListParams'

const ORDER_LIST_LIMIT = 10
const ORDER_SEARCH_DEBOUNCE_MS = 400

export const statusTabs: { value: OrderStatusTab; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const getFetchError = (error: unknown, fallback = 'Gagal memuat daftar pesanan') =>
  getApiFetchError(error, fallback)

export function useOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<CheckoutOrder[]>([])
  const [meta, setMeta] = useState<OrderListMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<ApiFetchError | null>(null)
  const error = fetchError?.message ?? null

  const statusGroupParam = searchParams.get('statusGroup')
  const activeStatusGroup: OrderStatusTab = isOrderStatusGroup(statusGroupParam) ? statusGroupParam : 'all'
  const page = getPositivePage(searchParams.get('page'))
  const search = getSearchValue(searchParams, 'search') || getSearchValue(searchParams, 'orderNumber')
  const startDate = getSearchValue(searchParams, 'startDate')
  const endDate = getSearchValue(searchParams, 'endDate')
  const searchParamString = searchParams.toString()

  const [searchDraft, setSearchDraft] = useState(search)
  const [startDateDraft, setStartDateDraft] = useState(startDate)
  const [endDateDraft, setEndDateDraft] = useState(endDate)

  useEffect(() => {
    const syncDraftId = window.setTimeout(() => {
      setSearchDraft(search)
    }, 0)
    return () => window.clearTimeout(syncDraftId)
  }, [search])

  useEffect(() => {
    const syncDateDraftId = window.setTimeout(() => {
      setStartDateDraft(startDate)
      setEndDateDraft(endDate)
    }, 0)
    return () => window.clearTimeout(syncDateDraftId)
  }, [startDate, endDate])

  useEffect(() => {
    const trimmedSearch = searchDraft.trim()
    if (trimmedSearch === search) return

    const debounceId = window.setTimeout(() => {
      setSearchParams(getDebouncedSearchParams(searchParamString, trimmedSearch), { replace: true })
    }, ORDER_SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(debounceId)
  }, [search, searchDraft, searchParamString, setSearchParams])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const result = await getOrders({
        page,
        limit: ORDER_LIST_LIMIT,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        statusGroup: activeStatusGroup === 'all' ? undefined : activeStatusGroup,
      })

      setOrders(result.orders)
      setMeta(result.meta)
    } catch (loadError) {
      setFetchError(getFetchError(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [activeStatusGroup, endDate, page, search, startDate])

  useEffect(() => {
    const loadOrdersId = window.setTimeout(() => {
      void loadOrders()
    }, 0)
    return () => window.clearTimeout(loadOrdersId)
  }, [loadOrders])

  const currentPage = meta?.page ?? page
  const totalPages = Math.max(meta?.totalPages ?? 1, 1)
  const totalOrders = meta?.total ?? 0
  const hasActiveFilters = Boolean(search || startDate || endDate || activeStatusGroup !== 'all')

  const totalInCurrentPage = useMemo(
    () => orders.reduce((total, order) => total + getOrderItemQuantity(order), 0),
    [orders],
  )

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchParams(getAppliedOrderFilterParams(searchParams, { searchDraft, startDateDraft, endDateDraft }))
  }

  const clearFilters = () => {
    setSearchDraft('')
    setStartDateDraft('')
    setEndDateDraft('')
    setSearchParams(getClearedOrderFilterParams(searchParams))
  }

  const changeStatusGroup = (statusGroup: OrderStatusTab) => {
    setSearchParams(getOrderStatusGroupParams(searchParams, statusGroup))
  }

  const goToPage = (nextPage: number) => {
    setSearchParams(getOrderPageParams(searchParams, nextPage))
  }

  return {
    orders,
    isLoading,
    error,
    activeStatusGroup,
    searchDraft,
    setSearchDraft,
    startDateDraft,
    setStartDateDraft,
    endDateDraft,
    setEndDateDraft,
    currentPage,
    totalPages,
    totalOrders,
    hasActiveFilters,
    totalInCurrentPage,
    loadOrders,
    applyFilters,
    clearFilters,
    changeStatusGroup,
    goToPage,
  }
}
