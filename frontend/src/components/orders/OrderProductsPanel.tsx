import { ReceiptText } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatCurrency } from './orderDisplay'

type OrderProductsPanelProps = {
  order: CheckoutOrder
}

export function OrderProductsPanel({ order }: OrderProductsPanelProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <ReceiptText aria-hidden="true" />
        <div>
          <h2>Ringkasan Produk</h2>
          <p>Produk yang masuk dalam pesanan ini.</p>
        </div>
      </div>

      <div className="checkout-product-list">
        {order.items.map((item) => {
          const image = item.product.images.find((productImage) => productImage.isPrimary) ?? item.product.images[0]

          return (
            <div key={item.id} className="checkout-product-item">
              <div className="checkout-summary-image">
                {image ? <img src={image.imageUrl} alt={item.product.name} /> : <span>Produk</span>}
              </div>
              <div className="checkout-product-info">
                <strong>{item.product.name}</strong>
                <span>{item.quantity} x {formatCurrency(item.priceAtTime)}</span>
                <em className="checkout-product-note">Subtotal sebelum diskon</em>
              </div>
              <strong>{formatCurrency(item.subtotal)}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
