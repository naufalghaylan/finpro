import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import { formatCurrency } from '../../utils/format'

type CartItemView = CartItem & {
  displayQuantity: number
  displayUnitPrice: number
  displayLineTotal: number
}

interface CartItemCardProps {
  item: CartItemView
  itemBusy: boolean
  stockUnavailable: boolean
  lowStock: boolean
  quantityDraft: string
  onDelete: (item: CartItem) => void
  onQuantityUpdate: (item: CartItem, quantity: number) => void
  onQuantityDraftChange: (item: CartItem, value: string) => void
  onQuantitySubmit: (item: CartItem) => void
  deletingItemId: number | null
}

const getPrimaryImage = (item: CartItem) =>
  item.product.images.find((image) => image.isPrimary) ?? item.product.images[0]

export function CartItemCard({
  item,
  itemBusy,
  stockUnavailable,
  lowStock,
  quantityDraft,
  onDelete,
  onQuantityUpdate,
  onQuantityDraftChange,
  onQuantitySubmit,
  deletingItemId,
}: CartItemCardProps) {
  const image = getPrimaryImage(item)
  const isDeleting = deletingItemId === item.id

  return (
    <article className={`cart-item ${stockUnavailable ? 'out-of-stock' : ''}`} aria-busy={itemBusy}>
      <div className="cart-item-product">
        <div className="cart-item-image">
          {image ? (
            <img src={image.imageUrl} alt={item.product.name} />
          ) : (
            <span>Tidak ada gambar</span>
          )}
        </div>

        <div className="cart-item-heading">
          <span className="product-tag">{item.product.category.name}</span>
          <h3>{item.product.name}</h3>
          {lowStock ? (
            <p className="cart-item-meta warning">
              <AlertTriangle className="button-icon" aria-hidden="true" />
              <span>Stok sisa {item.product.totalStock}</span>
            </p>
          ) : (
            <p className={`cart-item-meta ${stockUnavailable ? 'danger' : ''}`}>
              {stockUnavailable
                ? 'Stok habis'
                : `${item.product.totalStock} stok tersedia`}
            </p>
          )}
        </div>
      </div>

      <div className="cart-item-price-block">
        <span>Harga</span>
        {item.displayUnitPrice < item.product.basePrice ? (
          <div className="cart-item-price-group">
            <p className="cart-item-price-original">{formatCurrency(item.product.basePrice)}</p>
            <p className="cart-item-price">{formatCurrency(item.displayUnitPrice)}</p>
          </div>
        ) : (
          <p className="cart-item-price">{formatCurrency(item.displayUnitPrice)}</p>
        )}
      </div>

      <div className="cart-item-quantity-block">
        <span>Jumlah</span>
        <div className="cart-quantity-control" aria-label={`Jumlah ${item.product.name}`}>
          <button
            type="button"
            className="button ghost"
            disabled={itemBusy || (stockUnavailable && item.displayQuantity > 1)}
            aria-label={
              item.displayQuantity <= 1
                ? `Hapus ${item.product.name} dari keranjang`
                : `Kurangi jumlah ${item.product.name}`
            }
            onClick={() => {
              if (item.displayQuantity <= 1) {
                onDelete(item)
                return
              }
              onQuantityUpdate(item, item.displayQuantity - 1)
            }}
          >
            <Minus className="button-icon" aria-hidden="true" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={quantityDraft ?? String(item.quantity)}
            disabled={itemBusy || stockUnavailable}
            aria-label={`Jumlah ${item.product.name}`}
            onChange={(event) => onQuantityDraftChange(item, event.target.value)}
            onBlur={() => onQuantitySubmit(item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
          />
          <button
            type="button"
            className="button ghost"
            disabled={itemBusy || stockUnavailable || item.displayQuantity >= item.product.totalStock}
            aria-label={`Tambah jumlah ${item.product.name}`}
            onClick={() => onQuantityUpdate(item, item.displayQuantity + 1)}
          >
            <Plus className="button-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="cart-line-total-block">
        <span>Total</span>
        <p className="cart-line-total">{formatCurrency(item.displayLineTotal)}</p>
      </div>

      <button
        type="button"
        className="button ghost icon-only cart-remove-button"
        disabled={itemBusy}
        aria-label={`Hapus ${item.product.name} dari keranjang`}
        title="Hapus"
        onClick={() => onDelete(item)}
      >
        {isDeleting ? (
          <Loader2 className="button-icon spin" aria-hidden="true" />
        ) : (
          <Trash2 className="button-icon" aria-hidden="true" />
        )}
        <span className="sr-only">
          {isDeleting ? 'Menghapus...' : 'Hapus'}
        </span>
      </button>
    </article>
  )
}