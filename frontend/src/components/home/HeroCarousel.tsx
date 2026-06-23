import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import type { PromoSlide } from '../../types/home/home'

type HeroCarouselProps = {
  slides: PromoSlide[]
  storeName: string
}

export const HeroCarousel = ({ slides, storeName }: HeroCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [slides.length])

  const activeSlide = slides[activeIndex] ?? slides[0]

  return (
    <section className="pt-10 md:pt-16 pb-6" aria-label="Promo mingguan">
      <div className="w-full max-w-[1200px] mx-auto px-[clamp(16px,4vw,48px)] grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 items-center">
        <div className="flex flex-col gap-4">
          <span className="pill fade-in delay-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} />
            {activeSlide.kicker}
          </span>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2.6rem,4.4vw,4.4rem)] leading-[1.04] text-[var(--ink)] fade-in delay-2">{activeSlide.title}</h1>
          <p className="m-0 text-[1.05rem] text-[var(--ink-soft)] max-w-[560px] fade-in delay-3">{activeSlide.description}</p>
          <div className="flex flex-wrap gap-3 fade-in delay-4">
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4.5 py-2.5 font-semibold cursor-pointer bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] transition-all">
              {activeSlide.ctaLabel}
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-4.5 py-2.5 font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent">
              Lihat katalog
            </button>
          </div>
          <div className="flex items-center gap-2.5 text-[0.95rem] text-[var(--ink-soft)] fade-in delay-5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]"></span>
            <span>{activeSlide.note}</span>
          </div>
          <div className="w-fit px-4 py-2.5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] font-semibold text-[0.88rem] text-[var(--accent-strong)] tracking-wide uppercase fade-in delay-6">
            {activeSlide.highlight}
          </div>
          <div className="flex items-center gap-2 mt-2" aria-label="Slide promo">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`h-2.5 rounded-full border-none cursor-pointer transition-all duration-300 ease-in-out hover:bg-[var(--ink-soft)] ${index === activeIndex ? 'w-7 bg-[var(--accent)]' : 'w-2.5 bg-[var(--line)]'}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="relative grid gap-[18px] order-first md:order-last w-full">
          <div className="absolute -top-5 right-0 w-[140px] h-[140px] rounded-full bg-[rgba(95,149,123,0.25)] opacity-65 animate-[float_6s_ease-in-out_infinite] z-0 pointer-events-none"></div>
          <div className="absolute bottom-[30px] -left-2.5 w-[110px] h-[110px] rounded-full bg-[rgba(232,107,79,0.25)] opacity-65 animate-[float_6s_ease-in-out_infinite] [animation-delay:1.4s] z-0 pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-[0.8rem] uppercase tracking-wider bg-[#ef4444] text-white shadow-[var(--shadow-soft)] w-fit relative z-10">
            <Tag size={16} />
            Promo
          </div>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-[0.8rem] uppercase tracking-wider text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-soft)] w-fit relative z-10">
            Kirim dari {storeName}
          </div>
          
          <div className="grid gap-[14px] relative z-10 w-full">
            <div className="p-[18px] rounded-[20px] border border-[var(--line)] bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur-[10px] grid gap-1.5 -rotate-2 -translate-y-[6px]">
              <p className="m-0 font-semibold text-[var(--ink)]">Paket sayur pagi</p>
              <p className="m-0 text-[var(--ink-soft)] text-[0.95rem]">Siap 15 menit</p>
              <span className="w-fit px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-bold text-[0.75rem] tracking-[0.08em] uppercase block">Diskon 15%</span>
            </div>
            
            <div className="p-[18px] rounded-[20px] border border-[var(--line)] bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur-[10px] grid gap-1.5 rotate-2">
              <p className="m-0 font-semibold text-[var(--ink)]">Buah premium</p>
              <p className="m-0 text-[var(--ink-soft)] text-[0.95rem]">Manis dan renyah</p>
              <span className="w-fit px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-bold text-[0.75rem] tracking-[0.08em] uppercase block">Stok segar</span>
            </div>
            
            <div className="p-[18px] rounded-[20px] border border-[var(--line)] bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur-[10px] grid gap-1.5 -rotate-1 translate-y-[6px]">
              <p className="m-0 font-semibold text-[var(--ink)]">Protein siap masak</p>
              <p className="m-0 text-[var(--ink-soft)] text-[0.95rem]">Dinginkan optimal</p>
              <span className="w-fit px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-bold text-[0.75rem] tracking-[0.08em] uppercase block">Kurasi harian</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
