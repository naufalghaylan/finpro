import { ShieldCheck, Clock, CheckCircle } from 'lucide-react'
import type { ValueProp } from '../../types/home/home'

type ValueStripProps = {
  items: ValueProp[]
  sectionId?: string
}

export const ValueStrip = ({ items, sectionId }: ValueStripProps) => {
  return (
    <section className="py-[28px]" id={sectionId}>
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-5">
          <div>
            <p className="m-0 mb-2 uppercase tracking-[0.12em] text-[0.75rem] font-semibold text-[var(--accent-strong)]">Kenapa PanenMart</p>
            <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.2rem)] text-[var(--ink)] leading-tight">Belanja cepat dengan kualitas terjaga.</h2>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
          {items.map((item, index) => {
            let Icon = CheckCircle
            if (item.title.toLowerCase().includes('cepat')) Icon = Clock
            else if (item.title.toLowerCase().includes('kualitas') || item.title.toLowerCase().includes('kurasi')) Icon = ShieldCheck
            
            return (
              <div 
                key={item.id} 
                className="p-[18px] rounded-[18px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-soft)] opacity-0 flex flex-col items-center text-center animate-[fadeUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${0.1 + index * 0.08}s` }}
              >
                <Icon size={32} className="mb-4 text-[#10b981]" />
                <h3 className="m-0 mb-2 text-[1.05rem] text-[var(--ink)] font-semibold">{item.title}</h3>
                <p className="m-0 text-[var(--ink-soft)] text-[0.95rem]">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
