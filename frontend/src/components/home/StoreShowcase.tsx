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
    <section className="py-[28px]" id="stores">
      <div className="w-full max-w-[1200px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="flex justify-between items-end flex-wrap gap-4 mb-5">
          <div>
            <p className="m-0 mb-2 uppercase tracking-[0.12em] text-[0.75rem] font-semibold text-[var(--accent-strong)]">Jaringan store</p>
            <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.2rem)] text-[var(--ink)] leading-tight">Pilih store yang melayani area kamu.</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll('left')} className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-transparent px-3 py-2 min-w-auto font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Scroll left" disabled={!!error}>
              &larr;
            </button>
            <button onClick={() => scroll('right')} className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-transparent px-3 py-2 min-w-auto font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Scroll right" disabled={!!error}>
              &rarr;
            </button>
          </div>
        </div>
        
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--line)] text-center">
            <div className="w-16 h-16 rounded-full bg-[#fdf2f2] flex items-center justify-center text-[#c53030] mb-1">
              <AlertCircle size={32} />
            </div>
            <h3 className="m-0 text-xl text-[var(--ink)] font-[family-name:var(--font-display)]">Yah, gagal memuat jaringan store</h3>
            <p className="m-0 text-[var(--ink-soft)] max-w-[400px]">
              {error || 'Terjadi masalah saat memuat daftar store. Silakan coba beberapa saat lagi.'}
            </p>
            <button 
              type="button" 
              className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4.5 py-2.5 font-semibold cursor-pointer bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] transition-all mt-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw size={18} />
              Muat Ulang
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 scroll-smooth snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={scrollRef}>
            {stores.map((store) => (
              <article
                key={store.id}
                className={`flex-[0_0_280px] snap-start p-4 rounded-[18px] border bg-white transition-all ${store.id === activeStoreId ? 'border-[var(--accent)] shadow-[var(--shadow-soft)]' : 'border-[var(--line)]'}`}
                onClick={() => onSelectStore?.(store.id)}
                style={{ cursor: onSelectStore ? 'pointer' : 'default' }}
              >
                <div className="w-fit px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-[0.7rem] font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
                  <span>{store.isMain ? 'Utama' : 'Cabang'}</span>
                  {store.id === activeStoreId && (
                    <span className="bg-[#10b981] text-white px-1.5 py-0.5 rounded text-[0.7rem] font-bold">
                      Terdekat
                    </span>
                  )}
                </div>
                <h3 className="m-0 text-[1.1rem] font-semibold text-[var(--ink)] mb-1">{store.name}</h3>
                <p className="m-0 text-[0.95rem] text-[var(--ink-soft)] font-medium mb-1.5">{store.city}</p>
                <span className="block text-[0.85rem] text-[var(--ink-soft)]">{store.address}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
