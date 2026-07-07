import { ShoppingBasket } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import { CheckoutProductItem } from './CheckoutProductItem'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'

interface CheckoutProductListProps {
  items: CartItem[]
}

export function CheckoutProductList({ items }: CheckoutProductListProps) {
  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={ShoppingBasket} title="Produk Dipesan" description="Produk dari keranjang yang akan dibuat menjadi pesanan." />
      <CheckoutProductItems items={items} />
    </section>
  )
}

function CheckoutProductItems({ items }: CheckoutProductListProps) {
  return (
    <div className="checkout-product-list">
      {items.map((item) => <CheckoutProductItem key={item.id} item={item} />)}
    </div>
  )
}
