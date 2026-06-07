import type { StoreLocation } from '../../types/home/home'

type StoreShowcaseProps = {
  stores: StoreLocation[]
  activeStoreId: string
  onSelectStore?: (id: string) => void
}

export const StoreShowcase = ({ stores, activeStoreId, onSelectStore }: StoreShowcaseProps) => {
  return (
    <section className="section" id="stores">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="section-kicker">Jaringan store</p>
            <h2 className="section-title">Pilih store yang melayani area kamu.</h2>
          </div>
        </div>
        <div className="store-grid">
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
      </div>
    </section>
  )
}
