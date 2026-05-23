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
          {items.map((item) => (
            <div key={item.id} className="value-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
