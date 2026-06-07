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
    <section className="hero" aria-label="Promo mingguan">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <span className="pill fade-in delay-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} />
            {activeSlide.kicker}
          </span>
          <h1 className="hero-title fade-in delay-2">{activeSlide.title}</h1>
          <p className="hero-body fade-in delay-3">{activeSlide.description}</p>
          <div className="hero-actions fade-in delay-4">
            <button type="button" className="button primary">
              {activeSlide.ctaLabel}
            </button>
            <button type="button" className="button ghost">
              Lihat katalog
            </button>
          </div>
          <div className="hero-note fade-in delay-5">
            <span className="dot"></span>
            <span>{activeSlide.note}</span>
          </div>
          <div className="hero-highlight fade-in delay-6">
            {activeSlide.highlight}
          </div>
          <div className="hero-dots" aria-label="Slide promo">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
          <div className="hero-visual">
          <div className="hero-orb orb-1"></div>
          <div className="hero-orb orb-2"></div>
          <div className="hero-badge" style={{ top: '1rem', right: '1rem', left: 'auto', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={16} />
            Promo
          </div>
          <div className="hero-badge">Kirim dari {storeName}</div>
          <div className="hero-stack">
            <div className="hero-card top">
              <p className="hero-card-title">Paket sayur pagi</p>
              <p className="hero-card-sub">Siap 15 menit</p>
              <span className="hero-card-chip">Diskon 15%</span>
            </div>
            <div className="hero-card middle">
              <p className="hero-card-title">Buah premium</p>
              <p className="hero-card-sub">Manis dan renyah</p>
              <span className="hero-card-chip">Stok segar</span>
            </div>
            <div className="hero-card bottom">
              <p className="hero-card-title">Protein siap masak</p>
              <p className="hero-card-sub">Dinginkan optimal</p>
              <span className="hero-card-chip">Kurasi harian</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
