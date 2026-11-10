import { useState } from 'react'
import { AccountingAreas } from './components/AccountingAreas.tsx'
import { VatRegister } from './components/VatRegister.tsx'
import { WelcomeBar } from './components/WelcomeBar.tsx'
import { ledgerEntries } from './ledger/entries.ts'
import type { AreaId } from './ledger/types.ts'
import './App.css'

const PLACEHOLDERS: Record<Exclude<AreaId, 'vat'>, { title: string; body: string }> = {
  posting: {
    title: 'Księgowania',
    body: 'Obszar księgowań pozostaje demonstracyjny. Uruchomienie wymaga potwierdzenia konfiguracji.',
  },
  assets: {
    title: 'Majątek',
    body: 'Kartoteka majątku jest na mapie zakresu i nie przyjmuje jeszcze zapisów.',
  },
  controls: {
    title: 'Kontrole',
    body: 'Kontrole pokazują gotowość warunków. Ten podgląd nie wysyła danych na zewnątrz.',
  },
}

function AreaPlaceholder({ area }: { area: Exclude<AreaId, 'vat'> }) {
  const copy = PLACEHOLDERS[area]
  return (
    <section className="card placeholder" id="area-panel" role="tabpanel" aria-labelledby={`area-tab-${area}`}>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <p className="placeholder__status">Wymaga konfiguracji</p>
    </section>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [area, setArea] = useState<AreaId>('vat')

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  function openVat() {
    setArea('vat')
    requestAnimationFrame(() => {
      const target = document.getElementById('vat-screen')
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  return (
    <div className="shell">
      <WelcomeBar theme={theme} onThemeToggle={toggleTheme} />
      <main className="shell__main">
        <AccountingAreas activeArea={area} onAreaChange={setArea} onOpenVat={openVat} />
        {area === 'vat' ? (
          <div id="vat-screen">
            <div id="area-panel" role="tabpanel" aria-labelledby="area-tab-vat">
              <VatRegister entries={ledgerEntries} />
            </div>
          </div>
        ) : (
          <AreaPlaceholder area={area} />
        )}
      </main>
    </div>
  )
}
