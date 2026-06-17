import { ReceiptText } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { formatCurrency } from '../../../utils/format'
import { getUploadUrl } from '../../orders/orderDisplay'

type AdminOrderItemsPanelProps = {
  order: AdminOrder
}

export function AdminOrderItemsPanel({ order }: AdminOrderItemsPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ReceiptText className="w-5 h-5 text-admin-accent-strong" />
        <h4 className="text-base font-bold text-admin-ink m-0">Produk Dibeli</h4>
      </div>

      <div className="flex flex-col gap-3">
        {order.items.map((item) => {
          const image = item.product.images.find((productImage) => productImage.isPrimary) ?? item.product.images[0]
          const imageUrl = image ? getUploadUrl(image.imageUrl) : ''

          return (
            <div
              key={item.id}
              className="grid grid-cols-[56px_1fr_auto] gap-3 items-center rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-3"
            >
              <div className="w-14 h-14 rounded-lg bg-admin-surface overflow-hidden flex items-center justify-center text-xs text-admin-ink-muted">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  'Produk'
                )}
              </div>
              <div>
                <strong className="block text-sm text-admin-ink">{item.product.name}</strong>
                <span className="block text-xs text-admin-ink-muted mt-1">
                  {item.quantity} x {formatCurrency(item.priceAtTime)}
                </span>
              </div>
              <strong className="text-sm text-admin-ink text-right">{formatCurrency(item.subtotal)}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
