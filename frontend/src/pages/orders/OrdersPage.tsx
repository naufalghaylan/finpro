import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { OrderCard } from '../../components/orders/OrderCard'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { useOrdersPage, statusTabs } from '../../hooks/orders/useOrdersPage'
import { OrdersFilterPanel } from '../../components/orders/OrdersFilterPanel'
import { OrdersEmptyState, OrdersErrorState, OrdersLoadingState } from '../../components/orders/OrdersStateFeedback'

function OrdersPage() {
  const {
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
  } = useOrdersPage()

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
                  Lihat pesanan yang masih berjalan, selesai, atau dibatalkan. Filter berdasarkan tanggal, nomor
                  order, atau produk untuk menemukan transaksi lebih cepat.
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

            <OrdersFilterPanel
              searchDraft={searchDraft}
              startDateDraft={startDateDraft}
              endDateDraft={endDateDraft}
              hasActiveFilters={hasActiveFilters}
              onSearchChange={setSearchDraft}
              onStartDateChange={setStartDateDraft}
              onEndDateChange={setEndDateDraft}
              onSubmit={applyFilters}
              onClear={clearFilters}
            />

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
              <OrdersLoadingState />
            ) : error ? (
              <OrdersErrorState error={error} onRetry={() => void loadOrders()} />
            ) : orders.length === 0 ? (
              <OrdersEmptyState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
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
