import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Loader2,
  Search,
  Store as StoreIcon,
  X,
  XCircle,
} from 'lucide-react'
import { confirmManualPayment, getAdminOrders } from '../../api/order.api'
import { getStores } from '../../api/store'
import { useToast } from '../../components/common/Toast'
import {
  formatCurrency,
  formatDateTime,
  getOrderItemQuantity,
  getUploadUrl,
  orderStatusDisplay,
} from '../../components/orders/orderDisplay'
import { useAuthStore } from '../../store/authStore'
import type { AdminOrder, OrderListMeta, OrderStatus } from '../../types/order'
import type { Store } from '../../types/store'

const PAGE_LIMIT = 10

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'WAITING_CONFIRMATION', label: 'Menunggu Konfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'CONFIRMED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-admin-amber-soft text-admin-amber',
  WAITING_CONFIRMATION: 'bg-admin-blue-soft text-admin-blue',
  PROCESSING: 'bg-admin-green-soft text-admin-green',
  SHIPPED: 'bg-admin-blue-soft text-admin-blue',
  CONFIRMED: 'bg-admin-green-soft text-admin-green',
  CANCELLED: 'bg-admin-red-soft text-admin-red',
}

const paymentMethodLabel: Record<AdminOrder['paymentMethod'], string> = {
  MANUAL_TRANSFER: 'Manual Transfer',
  PAYMENT_GATEWAY: 'Payment Gateway',
}

type PaymentConfirmationAction = 'approve' | 'reject'

const emptyMeta: OrderListMeta = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

export default function AdminOrderList({ storeId }: { storeId?: number }) {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<OrderListMeta>(emptyMeta)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [selectedFilterStoreId, setSelectedFilterStoreId] = useState<number | ''>('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [pendingAction, setPendingAction] = useState<PaymentConfirmationAction | null>(null)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  const showStoreFilter = !storeId && user?.role === 'SUPER_ADMIN'

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const activeStoreId = storeId || (selectedFilterStoreId ? Number(selectedFilterStoreId) : undefined)
      const result = await getAdminOrders({
        page,
        limit: PAGE_LIMIT,
        storeId: activeStoreId,
        orderNumber: search.trim() || undefined,
        status: statusFilter || undefined,
      })

      setOrders(result.orders)
      setMeta(result.meta)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memuat pesanan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, selectedFilterStoreId, statusFilter, page, search])

  useEffect(() => {
    if (!showStoreFilter) return

    getStores(1, 100)
      .then((response) => setStores(response.data))
      .catch(() => setStores([]))
  }, [showStoreFilter])

  const handleConfirmManualPayment = async () => {
    if (!selectedOrder || !pendingAction) return

    try {
      setIsConfirmingPayment(true)
      const updatedOrder = await confirmManualPayment(selectedOrder.id, pendingAction)

      setOrders((currentOrders) =>
        currentOrders.map((order) => order.id === updatedOrder.id ? updatedOrder : order),
      )
      setSelectedOrder(updatedOrder)
      setPendingAction(null)
      showToast(
        pendingAction === 'approve'
          ? 'Pembayaran manual berhasil diterima'
          : 'Bukti bayar ditolak. User bisa upload ulang bukti pembayaran.',
        'success',
      )
      setSelectedOrder(null)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memproses konfirmasi pembayaran', 'error')
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const closePaymentReview = () => {
    if (isConfirmingPayment) return

    setSelectedOrder(null)
    setPendingAction(null)
  }

  const selectedPaymentProofUrl = selectedOrder ? getUploadUrl(selectedOrder.paymentProof) : ''

  return (
    <div className="font-[family-name:var(--font-admin)]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">
            {storeId ? 'Daftar Pesanan Toko' : 'Daftar Pesanan Global'}
          </h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${meta.total} pesanan ditemukan`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {showStoreFilter && (
            <div className="relative">
              <StoreIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
              <select
                value={selectedFilterStoreId}
                onChange={(event) => {
                  setSelectedFilterStoreId(event.target.value === '' ? '' : Number(event.target.value))
                  setPage(1)
                }}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
              >
                <option value="">Semua Toko</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
            </div>
          )}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as OrderStatus | '')
                setPage(1)
              }}
              className="px-4 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nomor order..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         placeholder:text-admin-ink-muted
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-admin-line-soft rounded-2xl bg-admin-surface-2/30">
            <ClipboardList className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0">
              {storeId ? 'Belum ada pesanan di toko ini.' : 'Belum ada pesanan yang sesuai filter.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider rounded-tl-2xl">Order</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Customer</th>
                  {!storeId && (
                    <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Toko</th>
                  )}
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Pembayaran</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Item</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right rounded-tr-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusMeta = orderStatusDisplay[order.status]
                  const StatusIcon = statusMeta.Icon

                  return (
                    <tr key={order.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-admin-ink">{order.orderNumber}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-admin-ink">{order.user.name}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">{order.user.email}</div>
                      </td>
                      {!storeId && (
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                            {order.store.name}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass[order.status]}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-admin-ink-soft">{paymentMethodLabel[order.paymentMethod]}</div>
                        <div className="text-xs text-admin-ink-muted mt-1">
                          {order.shippingService || order.shippingMethod || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-admin-surface-2 text-admin-ink-soft">
                          {getOrderItemQuantity(order)} item
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-admin-ink">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {order.paymentMethod === 'MANUAL_TRANSFER' &&
                        order.status === 'WAITING_CONFIRMATION' &&
                        order.paymentProof ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order)
                              setPendingAction(null)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       text-admin-accent-strong bg-admin-accent-soft border-none cursor-pointer
                                       hover:bg-admin-accent/15 transition-all duration-150"
                          >
                            Review
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-admin-ink-muted">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-admin-line-soft/50 bg-admin-surface-2/20">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>
            <span className="text-xs font-semibold text-admin-ink-muted">
              Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
            </span>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-admin-line-soft bg-admin-surface shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-admin-line-soft">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-admin-accent-strong m-0">
                  Review Pembayaran Manual
                </p>
                <h3 className="text-lg font-bold text-admin-ink m-0 mt-1">{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-admin-ink-muted m-0 mt-1">
                  Periksa bukti bayar sebelum menerima atau menolak pembayaran.
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentReview}
                disabled={isConfirmingPayment}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-admin-line-soft bg-admin-surface text-admin-ink-soft
                           hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                aria-label="Tutup review pembayaran"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-6">
              <div>
                <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 overflow-hidden">
                  {selectedPaymentProofUrl ? (
                    <img
                      src={selectedPaymentProofUrl}
                      alt={`Bukti pembayaran ${selectedOrder.orderNumber}`}
                      className="w-full max-h-[520px] object-contain bg-white"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <AlertTriangle className="w-9 h-9 text-admin-amber" />
                      <p className="text-sm text-admin-ink-muted m-0">Bukti bayar tidak tersedia.</p>
                    </div>
                  )}
                </div>
                {selectedPaymentProofUrl && (
                  <a
                    href={selectedPaymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-admin-accent-strong no-underline hover:underline"
                  >
                    Buka gambar di tab baru
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-admin-ink-muted m-0 mb-3">Ringkasan</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-admin-ink-muted">Customer</span>
                      <strong className="text-admin-ink">{selectedOrder.user.name}</strong>
                    </div>
                    <div>
                      <span className="block text-admin-ink-muted">Toko</span>
                      <strong className="text-admin-ink">{selectedOrder.store.name}</strong>
                    </div>
                    <div>
                      <span className="block text-admin-ink-muted">Total Bayar</span>
                      <strong className="text-admin-ink">{formatCurrency(selectedOrder.totalAmount)}</strong>
                    </div>
                    <div>
                      <span className="block text-admin-ink-muted">Tanggal Order</span>
                      <strong className="text-admin-ink">{formatDateTime(selectedOrder.createdAt)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingAction('approve')}
                    disabled={isConfirmingPayment || selectedOrder.status !== 'WAITING_CONFIRMATION'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               text-white bg-admin-green border-none cursor-pointer
                               hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Terima Pembayaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction('reject')}
                    disabled={isConfirmingPayment || selectedOrder.status !== 'WAITING_CONFIRMATION'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               text-admin-red bg-admin-red-soft border-none cursor-pointer
                               hover:bg-admin-red/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Bukti Bayar
                  </button>
                </div>

                {pendingAction && (
                  <div className="rounded-xl border border-admin-amber/30 bg-admin-amber-soft p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-admin-amber shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-admin-ink m-0">
                          {pendingAction === 'approve'
                            ? 'Terima pembayaran ini?'
                            : 'Tolak bukti bayar ini?'}
                        </h4>
                        <p className="text-xs text-admin-ink-soft leading-relaxed m-0 mt-1">
                          {pendingAction === 'approve'
                            ? 'Status pesanan akan berubah menjadi Diproses.'
                            : 'Status pesanan kembali ke Menunggu Pembayaran dan user bisa upload bukti baru.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setPendingAction(null)}
                        disabled={isConfirmingPayment}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-admin-ink-soft bg-admin-surface border border-admin-line-soft
                                   cursor-pointer hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleConfirmManualPayment()}
                        disabled={isConfirmingPayment}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white border-none
                                    cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                    ${pendingAction === 'approve' ? 'bg-admin-green' : 'bg-admin-red'}`}
                      >
                        {isConfirmingPayment && <Loader2 className="w-3.5 h-3.5 admin-spin" />}
                        {pendingAction === 'approve' ? 'Ya, Terima' : 'Ya, Tolak'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
