import { CircleDollarSign } from 'lucide-react'
import type { AdminOrder } from '../../../../types/order'
import { getOrderItemQuantity, getOrderDiscountBreakdown } from '../../../orders/orderDisplay'
import { formatCurrency } from '../../../../utils/format'

type AdminOrderSummaryPanelProps = {
  order: AdminOrder
}

export function AdminOrderSummaryPanel({ order }: AdminOrderSummaryPanelProps) {
  const totalItemQuantity = getOrderItemQuantity(order)
  const {
    storeDiscountAmount,
    referralVoucherAmount,
    otherVoucherAmount,
    voucherLabel,
  } = getOrderDiscountBreakdown(order)

  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CircleDollarSign className="h-5 w-5 text-admin-accent-strong" />
        <h4 className="m-0 text-base font-bold text-admin-ink">Ringkasan</h4>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-admin-ink-muted">Total item</span>
          <strong className="text-admin-ink">{totalItemQuantity} item</strong>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-admin-ink-muted">Subtotal produk</span>
          <strong className="text-admin-ink">{formatCurrency(order.totalProductAmount)}</strong>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-admin-ink-muted">Ongkir</span>
          <strong className="text-admin-ink">{formatCurrency(order.shippingCost)}</strong>
        </div>
        {storeDiscountAmount > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-admin-ink-muted">Diskon toko</span>
            <strong className="text-admin-ink">-{formatCurrency(storeDiscountAmount)}</strong>
          </div>
        )}
        {referralVoucherAmount > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-admin-ink-muted">Voucher referral</span>
            <strong className="text-admin-ink">-{formatCurrency(referralVoucherAmount)}</strong>
          </div>
        )}
        {otherVoucherAmount > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-admin-ink-muted">{voucherLabel ?? 'Voucher'}</span>
            <strong className="text-admin-ink">-{formatCurrency(otherVoucherAmount)}</strong>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-admin-line-soft pt-3">
          <span className="font-semibold text-admin-ink">Total bayar</span>
          <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
        </div>
      </div>
    </section>
  )
}
