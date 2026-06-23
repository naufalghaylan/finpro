import { ReceiptText } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { formatCurrency } from '../../../utils/format'
import { getOrderItemQuantity, getUploadUrl } from '../../orders/orderDisplay'

type AdminOrderItemsPanelProps = {
  order: AdminOrder
}

export function AdminOrderItemsPanel({ order }: AdminOrderItemsPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-admin-accent-strong" />
          <h4 className="m-0 text-base font-bold text-admin-ink">Produk Dibeli</h4>
        </div>
        <span className="rounded-full bg-admin-surface-2 px-2.5 py-1 text-xs font-bold text-admin-ink-soft">
          {getOrderItemQuantity(order)} item
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {order.items.map((item) => {
          const image = item.product.images.find((productImage) => productImage.isPrimary) ?? item.product.images[0]
          const imageUrl = image ? getUploadUrl(image.imageUrl) : ''

          return (
            <article
              key={item.id}
              className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-3 transition-colors hover:bg-admin-surface-2/55 md:grid-cols-[64px_minmax(0,1fr)_minmax(130px,auto)] md:items-center"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-admin-line-soft bg-admin-surface text-xs text-admin-ink-muted">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                ) : (
                  'Produk'
                )}
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-admin-ink">{item.product.name}</strong>
                <span className="mt-1 block text-xs text-admin-ink-muted">
                  {item.quantity} x {formatCurrency(item.priceAtTime)}
                </span>
              </div>
              <div className="col-span-2 border-t border-admin-line-soft pt-3 text-left md:col-span-1 md:border-t-0 md:pt-0 md:text-right">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-admin-ink-muted">
                  Subtotal
                </span>
                <strong className="text-sm text-admin-ink">{formatCurrency(item.subtotal)}</strong>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
