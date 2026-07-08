import { useState } from 'react'
import axios from 'axios'
import type { FooterSection } from '../../types/home/home'
import { subscribeNewsletter } from '../../api/homepage.api'

type HomeFooterProps = {
  brandName: string
  sections: FooterSection[]
}

export const HomeFooter = ({ brandName, sections }: HomeFooterProps) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage(null)

    try {
      const resMessage = await subscribeNewsletter(email)
      setMessage({ text: resMessage, type: 'success' })
      setEmail('')
    } catch (error: unknown) {
      setMessage({ 
        text: axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Gagal berlangganan. Silakan coba lagi.', 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="pt-12 pb-6 border-t border-[var(--line)] bg-[var(--surface)] mt-9">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)] grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-8 items-start">
        <div>
          <div className="inline-flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[1.1rem] tracking-[-0.02em] font-semibold text-[var(--ink)]">
            <img src="/PanenMartLogo.svg" alt="Logo" className="h-8 w-auto" />
            <span>{brandName}</span>
          </div>
          <p className="m-0 mt-3 text-[var(--ink-soft)]">
            Belanja kebutuhan segar, stok terbaru, dan rekomendasi menu harian dari
            toko terdekat.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
            <div className="flex flex-wrap gap-2.5">
              <label className="sr-only" htmlFor="footer-email">
                Email
              </label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email untuk update promo"
                className="flex-1 min-w-[180px] rounded-full border border-[var(--line)] px-3.5 py-2.5 bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 font-semibold cursor-pointer bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
            {message && (
              <p className={`text-[0.85rem] m-0 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 w-full">
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="m-0 mb-2.5 text-[0.95rem] text-[var(--ink)] font-semibold">{section.title}</h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="no-underline text-[var(--ink-soft)] text-[0.9rem] transition-colors hover:text-[var(--accent-strong)]">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)] flex flex-col items-center justify-center gap-2 mt-8 pt-6 border-t border-[var(--line)] text-[0.85rem] text-[var(--ink-soft)] text-center">
        <span>2026 {brandName}. Semua hak dilindungi.</span>
        <span>Operasional 07.00 - 21.00</span>
      </div>
    </footer>
  )
}
