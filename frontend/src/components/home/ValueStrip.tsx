import { ShieldCheck, Clock, CheckCircle } from 'lucide-react'
import type { ValueProp } from '../../types/home/home'

type ValueStripProps = {
  items: ValueProp[]
  sectionId?: string
}

export const ValueStrip = ({ items, sectionId }: ValueStripProps) => {
  return (
    <section className="section value-section" id={sectionId}>
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="section-kicker">Kenapa PanenMart</p>
            <h2 className="section-title">Belanja cepat dengan kualitas terjaga.</h2>
          </div>
        </div>
        <div className="value-grid">
          {items.map((item) => {
            let Icon = CheckCircle
            if (item.title.toLowerCase().includes('cepat')) Icon = Clock
            else if (item.title.toLowerCase().includes('kualitas') || item.title.toLowerCase().includes('kurasi')) Icon = ShieldCheck
            
            return (
              <div key={item.id} className="value-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Icon size={32} style={{ marginBottom: '1rem', color: '#10b981' }} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
