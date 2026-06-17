import { Eye } from 'lucide-react'
import { formatCurrency, formatDateTime, getOrderItemQuantity, orderStatusDisplay } from '../../orders/orderDisplay'
import type { AdminOrder, OrderStatus } from '../../../types/order'

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
  MANUAL_TRANSFER: 'Manual Transfer',
  PAYMENT_GATEWAY: 'Payment Gateway',
}

export function AdminOrderTable({ orders, storeId, onViewDetail }: AdminOrderTableProps) {
  return (
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
                  <button
                    type="button"
                    onClick={() => onViewDetail(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               text-admin-accent-strong bg-admin-accent-soft border-none cursor-pointer
                               hover:bg-admin-accent/15 transition-all duration-150"
                  >
                    <Eye className="w-3.5 h-3.5" />
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
