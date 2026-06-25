export type ApiData<T> = {
  data: T
}

export type ApiListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type ApiListData<T> = ApiData<T> & {
  meta: ApiListMeta
}
