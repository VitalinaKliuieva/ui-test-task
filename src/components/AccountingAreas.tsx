import { useState } from 'react'
import type { AreaId } from '../ledger/types.ts'
import type { IconName } from './Icon.tsx'
import { Icon } from './Icon.tsx'
import './AccountingAreas.css'

const AVAILABILITY: readonly {
  id: string
  label: string
  icon: IconName
  detail: string
}[] = [
  {
    id: 'vat-register',
    label: 'Rejestr VAT',
    icon: 'document',
    detail: 'Rejestr jest dostępny jako podgląd. Zapisy poniżej pozostają demonstracyjne.',
  },
  {
    id: 'kpir',
    label: 'KPiR',
    icon: 'bank',
    detail: 'KPiR wymaga konfiguracji przed pierwszym zapisem.',
  },
  {
    id: 'income',
    label: 'Ewidencja przychodów',
    icon: 'coins',
    detail: 'Ewidencja przychodów czeka na potwierdzenie okresu rozliczeniowego.',
  },
  {
    id: 'books',
    label: 'Pełne księgi',
    icon: 'books',
    detail: 'Pełne księgi pozostają poza zakresem tego podglądu.',
  },
  {
    id: 'assets-book',
    label: 'Majątek',
    icon: 'building',
    detail: 'Kartoteka majątku nie jest uruchomiona dla tej organizacji.',
  },
  {
    id: 'controls-ready',
    label: 'Kontrole',
    icon: 'check',
    detail: 'Kontrole pokazują gotowość warunków i nie wysyłają danych.',
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
}

export function AccountingAreas({ activeArea, onAreaChange }: AccountingAreasProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section className="map" aria-labelledby="map-title">
      <p className="eyebrow">Ewidencje</p>
      <h1 id="map-title">Obszary księgowe</h1>
      <p className="lede">
        Mapa dostępnych obszarów księgowych dla aktywnej organizacji.
      </p>
      <div className="notice">
        <Icon name="info" />
        <p>To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.</p>
      </div>
      <article className="card period">
        <span className="period__mark">
          <Icon name="calendar" />
        </span>
        <div>
          <h3>Okres księgowy · 2026</h3>
          <p>
            Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed
            uruchomieniem operacji księgowych.
          </p>
          <p className="period__status">Wymaga konfiguracji</p>
        </div>
      </article>
      <h2>Dostępność obszarów</h2>
      <p className="lede">
        Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.
      </p>
      <div className="card areas">
        {AVAILABILITY.map((item) => {
          const open = openId === item.id
          return (
            <div key={item.id}>
              <button
                type="button"
                className={open ? 'areas__item is-open' : 'areas__item'}
                aria-expanded={open}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              >
                <span className="areas__glyph">
                  <Icon name={item.icon} />
                </span>
                {item.label}
                <Icon name="chevron" />
              </button>
              {open ? <p className="areas__detail">{item.detail}</p> : null}
            </div>
          )
        })}
      </div>
      <h2 id="areas-label">Obszary</h2>
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
    </section>
  )
}
