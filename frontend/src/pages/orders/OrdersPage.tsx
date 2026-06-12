import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  RotateCcw,
  Search,
} from 'lucide-react'
import { getOrders } from '../../api/order.api'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { OrderCard } from '../../components/orders/OrderCard'
import { getOrderItemQuantity } from '../../components/orders/orderDisplay'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import type { CheckoutOrder, OrderStatusGroup, OrderListMeta } from '../../types/order'

type ErrorResponse = {
  message?: string
  error?: string
}

type OrderStatusTab = 'all' | OrderStatusGroup

const ORDER_LIST_LIMIT = 10

const statusTabs: { value: OrderStatusTab; label: string }[] = [
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

const getErrorMessage = (error: unknown, fallback = 'Gagal memuat daftar pesanan') => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback
  }

  return fallback
}

const setParamOrDelete = (params: URLSearchParams, key: string, value: string) => {
  if (value.trim()) {
    params.set(key, value.trim())
  } else {
    params.delete(key)
  }
}

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<CheckoutOrder[]>([])
  const [meta, setMeta] = useState<OrderListMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusGroupParam = searchParams.get('statusGroup')
  const activeStatusGroup: OrderStatusTab = isOrderStatusGroup(statusGroupParam) ? statusGroupParam : 'all'
  const page = getPositivePage(searchParams.get('page'))
  const orderNumber = getSearchValue(searchParams, 'orderNumber')
  const startDate = getSearchValue(searchParams, 'startDate')
  const endDate = getSearchValue(searchParams, 'endDate')

  const [orderNumberDraft, setOrderNumberDraft] = useState(orderNumber)
  const [startDateDraft, setStartDateDraft] = useState(startDate)
  const [endDateDraft, setEndDateDraft] = useState(endDate)

  useEffect(() => {
    const syncDraftId = window.setTimeout(() => {
      setOrderNumberDraft(orderNumber)
      setStartDateDraft(startDate)
      setEndDateDraft(endDate)
    }, 0)

    return () => window.clearTimeout(syncDraftId)
  }, [orderNumber, startDate, endDate])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getOrders({
        page,
        limit: ORDER_LIST_LIMIT,
        orderNumber: orderNumber || undefined,
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
  }, [activeStatusGroup, endDate, orderNumber, page, startDate])

  useEffect(() => {
    const loadOrdersId = window.setTimeout(() => {
      void loadOrders()
    }, 0)

    return () => window.clearTimeout(loadOrdersId)
  }, [loadOrders])

  const currentPage = meta?.page ?? page
  const totalPages = Math.max(meta?.totalPages ?? 1, 1)
  const totalOrders = meta?.total ?? 0
  const hasActiveFilters = Boolean(orderNumber || startDate || endDate || activeStatusGroup !== 'all')

  const totalInCurrentPage = useMemo(
    () => orders.reduce((total, order) => total + getOrderItemQuantity(order), 0),
    [orders],
  )

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextParams = new URLSearchParams(searchParams)
    setParamOrDelete(nextParams, 'orderNumber', orderNumberDraft)
    setParamOrDelete(nextParams, 'startDate', startDateDraft)
    setParamOrDelete(nextParams, 'endDate', endDateDraft)
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams)
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

  return (
    <div className="page orders-page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="section orders-section">
          <div className="shell">
            <div className="orders-header">
              <div>
                <p className="section-kicker">Pesanan Saya</p>
                <h1 className="section-title">Pantau pesananmu</h1>
                <p>
                  Lihat pesanan yang masih berjalan, selesai, atau dibatalkan. Filter berdasarkan tanggal dan nomor
                  order untuk menemukan transaksi lebih cepat.
                </p>
              </div>
              <div className="orders-header-stat">
                <ClipboardList aria-hidden="true" />
                <div>
                  <span>Total hasil</span>
                  <strong>{isLoading ? '...' : totalOrders}</strong>
                </div>
              </div>
            </div>

            <div className="orders-toolbar" aria-label="Filter status pesanan">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`orders-tab ${activeStatusGroup === tab.value ? 'active' : ''}`}
                  onClick={() => changeStatusGroup(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form className="orders-filter-panel" onSubmit={applyFilters}>
              <label className="orders-filter-field">
                <span>No Order</span>
                <div className="orders-input-shell">
                  <Search aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Contoh: ORD-202606"
                    value={orderNumberDraft}
                    onChange={(event) => setOrderNumberDraft(event.target.value)}
                  />
                </div>
              </label>

              <label className="orders-filter-field">
                <span>Dari Tanggal</span>
                <div className="orders-input-shell">
                  <CalendarDays aria-hidden="true" />
                  <input
                    type="date"
                    value={startDateDraft}
                    onChange={(event) => setStartDateDraft(event.target.value)}
                  />
                </div>
              </label>

              <label className="orders-filter-field">
                <span>Sampai Tanggal</span>
                <div className="orders-input-shell">
                  <CalendarDays aria-hidden="true" />
                  <input
                    type="date"
                    value={endDateDraft}
                    onChange={(event) => setEndDateDraft(event.target.value)}
                  />
                </div>
              </label>

              <div className="orders-filter-actions">
                <button type="submit" className="button primary">
                  <Search className="button-icon" aria-hidden="true" />
                  Cari
                </button>
                <button
                  type="button"
                  className="button ghost"
                  disabled={!hasActiveFilters}
                  onClick={clearFilters}
                >
                  <RotateCcw className="button-icon" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </form>

            <div className="orders-list-head">
              <p>
                {isLoading
                  ? 'Memuat pesanan...'
                  : `${totalOrders} pesanan ditemukan`}
              </p>
              {!isLoading && orders.length > 0 && (
                <span>{totalInCurrentPage} item produk di halaman ini</span>
              )}
            </div>

            {isLoading ? (
              <div className="orders-list">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="order-card order-card--skeleton">
                    <div className="order-skeleton-image" />
                    <div className="order-skeleton-body">
                      <span />
                      <strong />
                      <p />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="orders-state-card">
                <AlertCircle className="orders-state-icon danger" aria-hidden="true" />
                <h2>Daftar pesanan belum bisa dimuat</h2>
                <p>{error}</p>
                <button type="button" className="button primary" onClick={() => void loadOrders()}>
                  Coba Lagi
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-state-card">
                <ClipboardList className="orders-state-icon" aria-hidden="true" />
                <h2>Belum ada pesanan ditemukan</h2>
                <p>
                  {hasActiveFilters
                    ? 'Coba ubah nomor order, rentang tanggal, atau status pesanan.'
                    : 'Setelah checkout berhasil, pesananmu akan tampil di sini.'}
                </p>
                {hasActiveFilters ? (
                  <button type="button" className="button ghost" onClick={clearFilters}>
                    Reset Filter
                  </button>
                ) : (
                  <Link to="/catalog" className="button primary">
                    Mulai Belanja
                  </Link>
                )}
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {!isLoading && !error && totalPages > 1 && (
              <div className="orders-pagination">
                <button
                  type="button"
                  className="button ghost"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ArrowLeft className="button-icon" aria-hidden="true" />
                  Sebelumnya
                </button>
                <span>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  type="button"
                  className="button ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Selanjutnya
                  <ArrowRight className="button-icon" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}

export default OrdersPage
