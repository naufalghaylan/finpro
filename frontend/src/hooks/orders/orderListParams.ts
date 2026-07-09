import type { OrderStatusGroup } from '../../types/order'

export type OrderStatusTab = 'all' | OrderStatusGroup

type OrderFilterDrafts = {
  searchDraft: string
  startDateDraft: string
  endDateDraft: string
}

export const isOrderStatusGroup = (value: string | null): value is OrderStatusGroup =>
  value === 'ongoing' || value === 'completed' || value === 'cancelled'

export const getPositivePage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const getSearchValue = (searchParams: URLSearchParams, key: string) =>
  searchParams.get(key)?.trim() ?? ''

const setParamOrDelete = (params: URLSearchParams, key: string, value: string) => {
  if (value.trim()) {
    params.set(key, value.trim())
  } else {
    params.delete(key)
  }
}

export const getDebouncedSearchParams = (searchParamString: string, search: string) => {
  const nextParams = new URLSearchParams(searchParamString)
  setParamOrDelete(nextParams, 'search', search)
  nextParams.delete('orderNumber')
  nextParams.delete('page')
  return nextParams
}

export const getAppliedOrderFilterParams = (
  searchParams: URLSearchParams,
  { searchDraft, startDateDraft, endDateDraft }: OrderFilterDrafts,
) => {
  const nextParams = new URLSearchParams(searchParams)
  setParamOrDelete(nextParams, 'search', searchDraft)
  nextParams.delete('orderNumber')
  setParamOrDelete(nextParams, 'startDate', startDateDraft)
  setParamOrDelete(nextParams, 'endDate', endDateDraft)
  nextParams.delete('page')
  return nextParams
}

export const getClearedOrderFilterParams = (searchParams: URLSearchParams) => {
  const nextParams = new URLSearchParams(searchParams)
  nextParams.delete('search')
  nextParams.delete('orderNumber')
  nextParams.delete('startDate')
  nextParams.delete('endDate')
  nextParams.delete('statusGroup')
  nextParams.delete('status')
  nextParams.delete('page')
  return nextParams
}

export const getOrderStatusGroupParams = (searchParams: URLSearchParams, statusGroup: OrderStatusTab) => {
  const nextParams = new URLSearchParams(searchParams)
  if (statusGroup === 'all') {
    nextParams.delete('statusGroup')
  } else {
    nextParams.set('statusGroup', statusGroup)
  }
  nextParams.delete('status')
  nextParams.delete('page')
  return nextParams
}

export const getOrderPageParams = (searchParams: URLSearchParams, nextPage: number) => {
  const safePage = Math.max(1, nextPage)
  const nextParams = new URLSearchParams(searchParams)
  if (safePage === 1) {
    nextParams.delete('page')
  } else {
    nextParams.set('page', String(safePage))
  }
  return nextParams
}
