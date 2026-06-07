import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById } from '../../api/product.api'
import { useAddToCart } from '../../hooks/useAddToCart'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product } from '../../types/product'

//komponen & logic

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, addingProductId } = useAddToCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
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
              ← Kembali
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

              {/* Gambar Produk */}
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0].imageUrl} alt={product.name} style={{ width: '100%', objectFit: 'cover' }} />
                ) : (
                  <p style={{ color: 'var(--ink-soft)' }}>Tidak ada gambar</p>
                )}
              </div>

              {/* Info Produk */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    {product.stocks.map((stock) => (
                      <div key={stock.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                        <span>{stock.store?.name ?? `Toko #${stock.id}`}</span>
                        <span className={stock.quantity > 0 ? 'product-stock stock-ok' : 'product-stock stock-out'}>
                          {stock.quantity > 0 ? `${stock.quantity} tersedia` : 'Habis'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="button primary"
                  style={{ marginTop: '8px' }}
                  disabled={addingProductId === product.id || totalStock <= 0}
                  onClick={() => void addToCart(product)}
                >
                  {addingProductId === product.id ? 'Menambahkan...' : 'Tambah ke Keranjang'}
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
