import type { StoreLocation } from '../../types/home/home'

type StoreShowcaseProps = {
  stores: StoreLocation[]
  activeStoreId: string
}

export const StoreShowcase = ({ stores, activeStoreId }: StoreShowcaseProps) => {
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
            >
              <div className="store-chip">
                {store.isMain ? 'Utama' : 'Cabang'}
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
