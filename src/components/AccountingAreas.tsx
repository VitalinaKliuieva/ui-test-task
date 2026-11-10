import { useState } from 'react'
import type { AreaId } from '../ledger/types.ts'
import type { IconName } from './Icon.tsx'
import { Icon } from './Icon.tsx'
import './AccountingAreas.css'

type CardStatus = 'ready' | 'setup' | 'locked'

const CARDS: readonly {
  id: string
  area: AreaId
  label: string
  icon: IconName
  detail: string
  status: CardStatus
}[] = [
  {
    id: 'vat-register',
    area: 'vat',
    label: 'Rejestr VAT',
    icon: 'document',
    detail: 'Rejestr jest dostępny jako podgląd. Zapisy poniżej pozostają demonstracyjne.',
    status: 'ready',
  },
  {
    id: 'kpir',
    area: 'vat',
    label: 'KPiR',
    icon: 'bank',
    detail: 'KPiR wymaga konfiguracji przed pierwszym zapisem.',
    status: 'setup',
  },
  {
    id: 'income',
    area: 'vat',
    label: 'Ewidencja przychodów',
    icon: 'coins',
    detail: 'Ewidencja przychodów czeka na potwierdzenie okresu rozliczeniowego.',
    status: 'setup',
  },
  {
    id: 'books',
    area: 'posting',
    label: 'Pełne księgi',
    icon: 'books',
    detail: 'Pełne księgi pozostają poza zakresem tego podglądu.',
    status: 'locked',
  },
  {
    id: 'assets-book',
    area: 'assets',
    label: 'Majątek',
    icon: 'building',
    detail: 'Kartoteka majątku nie jest uruchomiona dla tej organizacji.',
    status: 'locked',
  },
  {
    id: 'controls-ready',
    area: 'controls',
    label: 'Kontrole',
    icon: 'check',
    detail: 'Kontrole pokazują gotowość warunków i nie wysyłają danych.',
    status: 'ready',
  },
]

const AREAS: readonly { id: AreaId; label: string; icon: IconName }[] = [
  { id: 'vat', label: 'Rejestry i VAT', icon: 'document' },
  { id: 'posting', label: 'Księgowania', icon: 'bank' },
  { id: 'assets', label: 'Majątek', icon: 'building' },
  { id: 'controls', label: 'Kontrole', icon: 'check' },
]

type AccountingAreasProps = {
  activeArea: AreaId
  onAreaChange: (area: AreaId) => void
  onOpenVat: () => void
}

export function AccountingAreas({ activeArea, onAreaChange, onOpenVat }: AccountingAreasProps) {
  const [configured, setConfigured] = useState(false)
  const visibleCards = CARDS.filter((card) => card.area === activeArea)

  return (
    <section className="map" aria-labelledby="map-title">
      <p className="eyebrow">Ewidencje</p>
      <h1 id="map-title">Obszary księgowe</h1>
      <p className="lede">Mapa dostępnych obszarów księgowych dla aktywnej organizacji.</p>
      <div className="notice">
        <Icon name="info" />
        <p>To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.</p>
      </div>
      <article className="hero" aria-labelledby="period-title">
        <span className="hero__tile">
          <Icon name="calendar" />
        </span>
        <div className="hero__copy">
          <h2 id="period-title">Okres księgowy · 2026</h2>
          <p>
            Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed
            uruchomieniem operacji księgowych.
          </p>
        </div>
        <svg
          className={configured ? 'ring is-on' : 'ring'}
          viewBox="0 0 36 36"
          aria-hidden="true"
        >
          <circle className="ring__track" cx="18" cy="18" r="15" />
          <circle className="ring__value" cx="18" cy="18" r="15" />
        </svg>
        <button
          type="button"
          className="hero__action"
          aria-pressed={configured}
          onClick={() => setConfigured((current) => !current)}
        >
          Wymaga konfiguracji
          <Icon name="arrow" />
        </button>
      </article>
      <div className="map__areas">
        <h2>Dostępność obszarów</h2>
        <p className="lede">
          Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.
        </p>
        <h3 id="areas-label">Obszary</h3>
        <div className="area-switch" role="tablist" aria-labelledby="areas-label">
          {AREAS.map((area) => {
            const selected = area.id === activeArea
            return (
              <button
                key={area.id}
                type="button"
                role="tab"
                id={`area-tab-${area.id}`}
                className={selected ? 'area-switch__tab is-active' : 'area-switch__tab'}
                aria-selected={selected}
                aria-controls="area-panel"
                onClick={() => onAreaChange(area.id)}
              >
                <Icon name={area.icon} />
                {area.label}
              </button>
            )
          })}
        </div>
        <div className="area-grid">
          {visibleCards.map((card) => {
            const body = (
              <>
                <span className="area-card__icon">
                  <Icon name={card.icon} />
                </span>
                <span className="area-card__main">
                  <span className="area-card__title">
                    <span className={`area-card__dot is-${card.status}`} aria-hidden="true" />
                    <span className="area-card__label">{card.label}</span>
                  </span>
                  <span className="area-card__detail">{card.detail}</span>
                </span>
                {card.status === 'locked' ? <Icon name="lock" /> : null}
              </>
            )
            if (card.id === 'vat-register') {
              return (
                <button key={card.id} type="button" className="area-card" onClick={onOpenVat}>
                  {body}
                </button>
              )
            }
            return (
              <article key={card.id} className={card.status === 'locked' ? 'area-card is-locked' : 'area-card'}>
                {body}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
