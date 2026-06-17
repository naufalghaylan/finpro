import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOrders } from '../../api/order.api'
import { getOrderItemQuantity } from '../../components/orders/orderDisplay'
import type { CheckoutOrder, OrderListMeta, OrderStatusGroup } from '../../types/order'
import { getApiErrorMessage } from '../../utils/apiError'

export type OrderStatusTab = 'all' | OrderStatusGroup

const ORDER_LIST_LIMIT = 10
const ORDER_SEARCH_DEBOUNCE_MS = 400

export const statusTabs: { value: OrderStatusTab; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const isOrderStatusGroup = (value: string | null): value is OrderStatusGroup =>
  value === 'ongoing' || value === 'completed' || value === 'cancelled'

const getPositivePage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const getSearchValue = (searchParams: URLSearchParams, key: string) =>
  searchParams.get(key)?.trim() ?? ''

const getErrorMessage = (error: unknown, fallback = 'Gagal memuat daftar pesanan') =>
  getApiErrorMessage(error, fallback)

const setParamOrDelete = (params: URLSearchParams, key: string, value: string) => {
  if (value.trim()) {
    params.set(key, value.trim())
  } else {
    params.delete(key)
  }
}

export function useOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<CheckoutOrder[]>([])
  const [meta, setMeta] = useState<OrderListMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const nextParams = new URLSearchParams(searchParamString)
      setParamOrDelete(nextParams, 'search', trimmedSearch)
      nextParams.delete('orderNumber')
      nextParams.delete('page')
      setSearchParams(nextParams, { replace: true })
    }, ORDER_SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(debounceId)
  }, [search, searchDraft, searchParamString, setSearchParams])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

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
      setError(getErrorMessage(loadError))
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
    const nextParams = new URLSearchParams(searchParams)
    setParamOrDelete(nextParams, 'search', searchDraft)
    nextParams.delete('orderNumber')
    setParamOrDelete(nextParams, 'startDate', startDateDraft)
    setParamOrDelete(nextParams, 'endDate', endDateDraft)
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams)
    setSearchDraft('')
    setStartDateDraft('')
    setEndDateDraft('')
    nextParams.delete('search')
    nextParams.delete('orderNumber')
    nextParams.delete('startDate')
    nextParams.delete('endDate')
    nextParams.delete('statusGroup')
    nextParams.delete('status')
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const changeStatusGroup = (statusGroup: OrderStatusTab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (statusGroup === 'all') {
      nextParams.delete('statusGroup')
    } else {
      nextParams.set('statusGroup', statusGroup)
    }
    nextParams.delete('status')
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(1, nextPage)
    const nextParams = new URLSearchParams(searchParams)
    if (safePage === 1) {
      nextParams.delete('page')
    } else {
      nextParams.set('page', String(safePage))
    }
    setSearchParams(nextParams)
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
