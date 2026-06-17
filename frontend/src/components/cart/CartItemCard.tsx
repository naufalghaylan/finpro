import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem } from '../../types/cart'
import { formatCurrency } from '../../utils/format'

type CartItemView = CartItem & {
  displayQuantity: number
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

  return (
    <article className="cart-item">
      <div className="cart-item-image">
        {image ? (
          <img src={image.imageUrl} alt={item.product.name} />
        ) : (
          <span>Tidak ada gambar</span>
        )}
      </div>

      <div className="cart-item-content">
        <div className="cart-item-top">
          <div>
            <span className="product-tag">{item.product.category.name}</span>
            <h3>{item.product.name}</h3>
            {lowStock ? (
              <p className="cart-item-meta warning">
                <AlertTriangle className="button-icon" aria-hidden="true" />
                <span>Stok sisa {item.product.totalStock}</span>
              </p>
            ) : (
              <p className="cart-item-meta">
                {stockUnavailable
                  ? 'Stok habis'
                  : `${item.product.totalStock} stok tersedia`}
              </p>
            )}
          </div>
          <button
            type="button"
            className="button ghost icon-only cart-remove-button"
            disabled={itemBusy}
            aria-label={`Hapus ${item.product.name} dari keranjang`}
            title="Hapus"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="button-icon" aria-hidden="true" />
            <span className="sr-only">
              {deletingItemId === item.id ? 'Menghapus...' : 'Hapus'}
            </span>
          </button>
        </div>

        <div className="cart-item-bottom">
          <p className="cart-item-price">{formatCurrency(item.product.basePrice)}</p>
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
          <p className="cart-line-total">{formatCurrency(item.displayLineTotal)}</p>
        </div>
      </div>
    </article>
  )
}
