import type { Product } from '../../types/home/home'
import { formatPrice } from '../../utils/home/format'

type ProductGridProps = {
  products: Product[]
  storeId: string
  storeName: string
}

const getStockLabel = (stock: number) => {
  if (stock <= 0) {
    return 'Habis'
  }
  if (stock <= 20) {
    return 'Stok terbatas'
  }
  return 'Stok aman'
}

const getStockClass = (stock: number) => {
  if (stock <= 0) {
    return 'stock-out'
  }
  if (stock <= 20) {
    return 'stock-low'
  }
  return 'stock-ok'
}

export const ProductGrid = ({ products, storeId, storeName }: ProductGridProps) => {
  return (
    <section className="section" id="products">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="section-kicker">Produk terdekat</p>
            <h2 className="section-title">Fresh picks dari {storeName}</h2>
          </div>
          <button type="button" className="button ghost">
            Lihat semua
          </button>
        </div>
        <div className="product-grid">
          {products.map((product) => {
            const stock = product.stocks[storeId] ?? 0
            const stockLabel = getStockLabel(stock)
            const stockClass = getStockClass(stock)

            return (
              <article key={product.id} className="product-card">
                <div className={`product-swatch ${product.swatch}`}>
                  <span>{product.category}</span>
                </div>
                <div className="product-meta">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span className="product-tag">{product.tag}</span>
                  </div>
                  <p className="product-price">
                    {formatPrice(product.price)} / {product.unit}
                  </p>
                  <div className="product-rating">
                    <span>{product.rating.toFixed(1)} rating</span>
                    <span>{product.reviews} ulasan</span>
                  </div>
                  <div className={`product-stock ${stockClass}`}>{stockLabel}</div>
                </div>
                <div className="product-footer">
                  <button type="button" className="button primary">
                    Tambah ke daftar
                  </button>
                  <button type="button" className="button ghost">
                    Detail
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
