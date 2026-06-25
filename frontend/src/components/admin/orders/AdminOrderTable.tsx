import { Eye, Package } from 'lucide-react'
import {
  formatCurrency,
  formatDateTime,
  getOrderItemQuantity,
  getUploadUrl,
  orderStatusDisplay,
} from '../../orders/orderDisplay'
import type { AdminOrder, OrderStatus, StockFulfillmentStatus } from '../../../types/order'

type AdminOrderTableProps = {
  orders: AdminOrder[]
  storeId?: number
  onViewDetail: (order: AdminOrder) => void
}

const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-admin-amber-soft text-admin-amber',
  WAITING_CONFIRMATION: 'bg-admin-blue-soft text-admin-blue',
  PROCESSING: 'bg-admin-green-soft text-admin-green',
  SHIPPED: 'bg-admin-blue-soft text-admin-blue',
  CONFIRMED: 'bg-admin-green-soft text-admin-green',
  CANCELLED: 'bg-admin-red-soft text-admin-red',
}

const paymentMethodLabel: Record<AdminOrder['paymentMethod'], string> = {
  MANUAL_TRANSFER: 'Transfer Manual',
  PAYMENT_GATEWAY: 'Pembayaran Online',
}

const fulfillmentStatusDisplay: Record<StockFulfillmentStatus, { label: string; className: string }> = {
  NOT_REQUIRED: { label: 'Tidak perlu mutasi', className: 'bg-admin-surface-2 text-admin-ink-muted' },
  REQUIRED: { label: 'Perlu mutasi', className: 'bg-admin-amber-soft text-admin-amber' },
  PENDING: { label: 'Menunggu persetujuan', className: 'bg-admin-amber-soft text-admin-amber' },
  IN_TRANSIT: { label: 'Mutasi dalam perjalanan', className: 'bg-admin-blue-soft text-admin-blue' },
  COMPLETED: { label: 'Mutasi diterima', className: 'bg-admin-green-soft text-admin-green' },
  REJECTED: { label: 'Mutasi ditolak', className: 'bg-admin-red-soft text-admin-red' },
}

export function AdminOrderTable({ orders, storeId, onViewDetail }: AdminOrderTableProps) {
  return (
    <div className="admin-table-wrap overflow-x-auto">
      <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
        <caption className="sr-only">Daftar pesanan admin</caption>
        <thead>
          <tr className="border-b border-admin-line-soft bg-admin-surface-2/55">
            <th className="w-[190px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft rounded-tl-2xl">Order</th>
            <th className="w-[270px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Produk</th>
            <th className="w-[220px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Pelanggan</th>
            {!storeId && (
              <th className="w-[180px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Cabang</th>
            )}
            <th className="w-[190px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Status</th>
            <th className="w-[190px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Operasional</th>
            <th className="w-[150px] px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Total</th>
            <th className="w-[120px] px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-admin-ink-soft rounded-tr-2xl">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const statusMeta = orderStatusDisplay[order.status]
            const fulfillmentMeta = fulfillmentStatusDisplay[order.stockFulfillment.status]
            const StatusIcon = statusMeta.Icon
            const firstItem = order.items[0]
            const image = firstItem?.product.images.find((productImage) => productImage.isPrimary)
              ?? firstItem?.product.images[0]
            const imageUrl = getUploadUrl(image?.imageUrl ?? null)
            const totalQuantity = getOrderItemQuantity(order)
            const remainingProductCount = Math.max(order.items.length - 1, 0)

            return (
              <tr key={order.id} className="admin-table-row border-b border-admin-line-soft/70 last:border-b-0">
                <td className="px-5 py-4 align-top">
                  <div className="font-bold text-admin-ink">{order.orderNumber}</div>
                  <div className="mt-1 text-xs leading-5 text-admin-ink-muted">{formatDateTime(order.createdAt)}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-admin-line-soft bg-admin-surface text-admin-ink-muted">
                      {imageUrl ? (
                        <img src={imageUrl} alt={firstItem?.product.name ?? 'Produk'} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-admin-ink">
                        {firstItem?.product.name ?? 'Produk tidak tersedia'}
                      </strong>
                      <span className="mt-1 block text-xs text-admin-ink-muted">
                        {totalQuantity} item{remainingProductCount > 0 ? `, +${remainingProductCount} produk lain` : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="truncate font-semibold text-admin-ink">{order.user.name}</div>
                  <div className="mt-1 truncate text-xs text-admin-ink-muted">{order.user.email}</div>
                </td>
                {!storeId && (
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex max-w-full items-center rounded-full bg-admin-surface-2 px-2.5 py-1 text-xs font-semibold text-admin-ink-soft">
                      <span className="truncate">{order.store.name}</span>
                    </span>
                  </td>
                )}
                <td className="px-5 py-4 align-top">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass[order.status]}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusMeta.label}
                    </span>
                    {order.stockFulfillment.required && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${fulfillmentMeta.className}`}>
                        {fulfillmentMeta.label}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="font-semibold text-admin-ink-soft">{paymentMethodLabel[order.paymentMethod]}</div>
                  <div className="mt-1 text-xs leading-5 text-admin-ink-muted">
                    {order.shippingService || order.shippingMethod || 'Pengiriman belum dipilih'}
                  </div>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <div className="font-bold text-admin-ink">{formatCurrency(order.totalAmount)}</div>
                  <div className="mt-1 text-xs text-admin-ink-muted">{totalQuantity} item</div>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onViewDetail(order)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-accent-soft px-3 py-1.5 text-xs font-semibold text-admin-accent-strong transition-all duration-150 hover:bg-admin-accent/15"
                    aria-label={`Lihat detail pesanan ${order.orderNumber}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
