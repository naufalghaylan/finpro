import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { getProductById } from '../../api/product.api'
import { useAddToCart } from '../../hooks/useAddToCart'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product, Discount } from '../../types/product'
import { getImageUrl } from '../../utils/image'

//komponen & logic

// Label diskon untuk badge per toko.
const discountBadgeLabel = (d: Discount) => {
  if (d.discountType === 'PERCENTAGE') return `Diskon ${d.discountValue}%`
  if (d.discountType === 'NOMINAL') return `Diskon Rp ${d.discountValue.toLocaleString('id-ID')}`
  if (d.discountType === 'BUY_ONE_GET_ONE') return 'Beli 1 Gratis 1'
  return 'Diskon'
}

// Diskon dianggap berlaku bila aktif dan sedang dalam rentang tanggalnya.
const isDiscountActiveNow = (d: Discount) => {
  if (!d.isActive) return false
  const now = Date.now()
  if (d.startDate && new Date(d.startDate).getTime() > now) return false
  if (d.endDate && new Date(d.endDate).getTime() < now) return false
  return true
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, addingProductId } = useAddToCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!id) return
    Promise.resolve().then(() => {
      setLoading(true)
      setActiveImage(0)
    })
    getProductById(parseInt(id))
      .then(setProduct)
      .catch(() => setError('Produk tidak ditemukan'))
      .finally(() => setLoading(false))
  }, [id])

  // JSX

    if (loading) return <div className="page"><p style={{ padding: '48px' }}>Memuat produk...</p></div>
  if (error || !product) return <div className="page"><p style={{ padding: '48px', color: 'var(--accent)' }}>{error}</p></div>

  const totalStock = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) ?? 0

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="section">
          <div className="shell">

            {/* Tombol kembali */}
            <button className="button ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
              <ArrowLeft className="button-icon" aria-hidden="true" />
              <span>Kembali</span>
            </button>

            <div className="product-detail">

              {/* Gambar Produk */}
              <div className="product-gallery">
                <div className="product-gallery-main">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[activeImage]?.imageUrl ?? product.images[0].imageUrl)}
                      alt={product.name}
                    />
                  ) : (
                    <p style={{ color: 'var(--ink-soft)' }}>Tidak ada gambar</p>
                  )}
                </div>

                {/* Thumbnail galeri */}
                {product.images && product.images.length > 1 && (
                  <div className="product-gallery-thumbs">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`product-gallery-thumb${index === activeImage ? ' is-active' : ''}`}
                        aria-label={`Lihat foto ${index + 1}`}
                      >
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={`${product.name} ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Produk */}
              <div className="product-detail-info">
                <span className="product-tag" style={{ width: 'fit-content' }}>{product.category.name}</span>
                <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{product.name}</h1>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                  Rp {product.basePrice.toLocaleString('id-ID')}
                </p>
                {product.description && (
                  <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>{product.description}</p>
                )}
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                  Berat: {product.weight}g
                </p>

                {/* Stok per Store */}
                {product.stocks && product.stocks.length > 0 && (
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>Stok tersedia:</p>
                    {product.stocks.map((stock) => {
                      // Diskon untuk produk ini yang berlaku di toko tsb.
                      const storeDiscounts = (product.discounts ?? []).filter(
                        (d) => d.storeId === stock.store?.id && isDiscountActiveNow(d)
                      )
                      return (
                        <div key={stock.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                          <span>{stock.store?.name ?? `Toko #${stock.id}`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {storeDiscounts.map((d) => (
                              <span key={d.id} className={`product-discount-badge${d.discountType === 'BUY_ONE_GET_ONE' ? ' product-badge-bogo' : ''}`}>
                                {discountBadgeLabel(d)}
                              </span>
                            ))}
                            <span className={stock.quantity > 0 ? 'product-stock stock-ok' : 'product-stock stock-out'}>
                              {stock.quantity > 0 ? `${stock.quantity} tersedia` : 'Habis'}
                            </span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  className="button primary"
                  style={{ marginTop: '8px' }}
                  disabled={addingProductId === product.id || totalStock <= 0}
                  onClick={() => void addToCart(product)}
                >
                  <ShoppingCart className="button-icon" aria-hidden="true" />
                  <span>{addingProductId === product.id ? 'Menambahkan...' : 'Tambah ke Keranjang'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
