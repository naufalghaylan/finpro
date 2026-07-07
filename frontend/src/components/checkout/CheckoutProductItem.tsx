import type { CartItem } from '../../types/cart'
import { formatCurrency } from '../../utils/format'

type CheckoutProductItemProps = {
  item: CartItem
}

export function CheckoutProductItem({ item }: CheckoutProductItemProps) {
  return (
    <div className="checkout-product-item">
      <CheckoutProductImage item={item} />
      <CheckoutProductInfo item={item} />
      <strong>{formatCurrency(item.lineTotal)}</strong>
    </div>
  )
}

function CheckoutProductImage({ item }: CheckoutProductItemProps) {
  const image = getPrimaryImage(item)
  return <div className="checkout-summary-image">{image ? <img src={image.imageUrl} alt={item.product.name} /> : <span>Produk</span>}</div>
}

function CheckoutProductInfo({ item }: CheckoutProductItemProps) {
  return (
    <div className="checkout-product-info">
      <strong>{item.product.name}</strong>
      <span>{item.product.category.name}</span>
      <span>{item.quantity} x {formatCurrency(getItemUnitPrice(item))}</span>
    </div>
  )
}

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

const getItemUnitPrice = (item: CartItem) =>
  item.quantity > 0 ? item.lineTotal / item.quantity : item.product.basePrice
