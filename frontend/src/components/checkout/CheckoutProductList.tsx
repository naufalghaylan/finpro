import { ShoppingBasket } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import { formatCurrency } from '../../utils/format'

interface CheckoutProductListProps {
  items: CartItem[]
}

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

export function CheckoutProductList({ items }: CheckoutProductListProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <ShoppingBasket aria-hidden="true" />
        <div>
          <h2>Ringkasan Produk</h2>
          <p>Item dari cart yang akan dibuat menjadi pesanan.</p>
        </div>
      </div>

      <div className="checkout-product-list">
        {items.map((item) => {
          const image = getPrimaryImage(item)

          return (
            <div key={item.id} className="checkout-product-item">
              <div className="checkout-summary-image">
                {image ? <img src={image.imageUrl} alt={item.product.name} /> : <span>Produk</span>}
              </div>
              <div className="checkout-product-info">
                <strong>{item.product.name}</strong>
                <span>{item.product.category.name}</span>
                <span>{item.quantity} x {formatCurrency(item.product.basePrice)}</span>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
