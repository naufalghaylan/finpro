import type { CartItem } from '../../types/cart'
import { formatCurrency } from '../../utils/format'
import { getCartItemAvailability } from '../../utils/cartAvailability'

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
  const originalUnitPrice = getOriginalUnitPrice(item)
  const finalUnitPrice = getFinalUnitPrice(item)
  const hasProductDiscount = finalUnitPrice < originalUnitPrice
  const availability = getCartItemAvailability(item)

  return (
    <div className="checkout-product-info">
      <strong>{item.product.name}</strong>
      <span>{item.product.category.name}</span>
      <span className="checkout-product-unit-price">
        <span>{item.quantity} x</span>
        {hasProductDiscount ? (
          <>
            <span className="checkout-price-original">{formatCurrency(originalUnitPrice)}</span>
            <span className="checkout-price-current">{formatCurrency(finalUnitPrice)}</span>
          </>
        ) : (
          <span>{formatCurrency(finalUnitPrice)}</span>
        )}
      </span>
      {(availability.blocksCheckout || availability.fulfilledFromOtherBranch) && (
        <em className={`checkout-product-note ${availability.blocksCheckout ? 'danger' : 'info'}`}>
          {availability.message}
        </em>
      )}
    </div>
  )
}

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

const getOriginalUnitPrice = (item: CartItem) => item.product.basePrice

const getFinalUnitPrice = (item: CartItem) =>
  item.quantity > 0 ? item.lineTotal / item.quantity : item.product.basePrice
