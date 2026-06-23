import { useRef } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import type { StoreLocation } from '../../types/home/home'

type StoreShowcaseProps = {
  stores: StoreLocation[]
  activeStoreId: string
  onSelectStore?: (id: string) => void
  error?: string | null
}

export const StoreShowcase = ({ stores, activeStoreId, onSelectStore, error }: StoreShowcaseProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="section" id="stores">
      <div className="shell">
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p className="section-kicker">Jaringan store</p>
            <h2 className="section-title">Pilih store yang melayani area kamu.</h2>
          </div>
          <div className="carousel-nav" style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => scroll('left')} className="button ghost" style={{ padding: '8px 12px', minWidth: 'auto' }} aria-label="Scroll left" disabled={!!error}>
              &larr;
            </button>
            <button onClick={() => scroll('right')} className="button ghost" style={{ padding: '8px 12px', minWidth: 'auto' }} aria-label="Scroll right" disabled={!!error}>
              &rarr;
            </button>
          </div>
        </div>
        
        {error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '48px 24px',
            background: 'var(--surface)',
            borderRadius: '24px',
            border: '1px dashed var(--line)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fdf2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c53030',
              marginBottom: '4px'
            }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Yah, gagal memuat jaringan store</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)', maxWidth: '400px' }}>
              {error || 'Terjadi masalah saat memuat daftar store. Silakan coba beberapa saat lagi.'}
            </p>
            <button 
              type="button" 
              className="button primary" 
              style={{ marginTop: '8px' }}
              onClick={() => window.location.reload()}
            >
              <RefreshCcw size={18} />
              Muat Ulang
            </button>
          </div>
        ) : (
          <div className="store-grid" ref={scrollRef}>
            {stores.map((store) => (
              <article
                key={store.id}
                className={`store-card ${store.id === activeStoreId ? 'active' : ''}`}
                onClick={() => onSelectStore?.(store.id)}
                style={{ cursor: onSelectStore ? 'pointer' : 'default' }}
              >
                <div className="store-chip" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{store.isMain ? 'Utama' : 'Cabang'}</span>
                  {store.id === activeStoreId && (
                    <span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      Terdekat
                    </span>
                  )}
                </div>
                <h3>{store.name}</h3>
                <p>{store.city}</p>
                <span>{store.address}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
