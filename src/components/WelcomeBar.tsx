import { useState } from 'react'
import { Icon } from './Icon.tsx'
import './WelcomeBar.css'

const NOTICES = [
  {
    id: 'vat-context',
    title: 'Kontekst VAT wymaga potwierdzenia',
    detail: 'Podgląd nie zapisuje ewidencji organizacji.',
  },
  {
    id: 'period',
    title: 'Okres księgowy 2026 wymaga konfiguracji',
    detail: 'Rok rozliczeniowy pozostaje orientacyjny.',
  },
  {
    id: 'sales',
    title: '14 zapisów demonstracyjnych w rejestrze sprzedaży',
    detail: 'Seria DEMO, październik 2026.',
  },
  {
    id: 'ksef',
    title: 'Brak potwierdzenia KSeF dla serii DEMO',
    detail: 'Identyfikatory DEMO nie wychodzą poza podgląd.',
  },
] as const

type WelcomeBarProps = {
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

export function WelcomeBar({ theme, onThemeToggle }: WelcomeBarProps) {
  const [open, setOpen] = useState<'notices' | 'account' | null>(null)
  const dark = theme === 'dark'

  function toggle(next: 'notices' | 'account') {
    setOpen((current) => (current === next ? null : next))
  }

  return (
    <header className="welcome" onKeyDown={(event) => {
      if (event.key === 'Escape') setOpen(null)
    }}>
      <p className="welcome__greeting">Witaj, Preview Reviewer!</p>
      <div className="welcome__tools">
        <button
          type="button"
          className="welcome__icon-button"
          aria-pressed={dark}
          aria-label={dark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          onClick={onThemeToggle}
        >
          <Icon name="sun" />
        </button>
        <button
          type="button"
          className="welcome__icon-button"
          aria-expanded={open === 'notices'}
          aria-controls="notices-panel"
          aria-label="Powiadomienia, 4 nowe"
          onClick={() => toggle('notices')}
        >
          <Icon name="bell" />
          <span className="welcome__badge">4</span>
        </button>
        <span className="welcome__divider" aria-hidden="true" />
        <button
          type="button"
          className="welcome__account"
          aria-expanded={open === 'account'}
          aria-controls="account-panel"
          aria-haspopup="true"
          onClick={() => toggle('account')}
        >
          <span className="welcome__identity">
            <strong>Preview Reviewer</strong>
            <small>Konto użytkownika</small>
          </span>
          <span className="welcome__avatar">
            <Icon name="user" />
          </span>
          <Icon name="chevron" />
        </button>
        {open === 'notices' ? (
          <div className="welcome__popover" id="notices-panel" role="region" aria-label="Powiadomienia">
            <h2>Powiadomienia</h2>
            <ul>
              {NOTICES.map((notice) => (
                <li key={notice.id}>
                  {notice.title}
                  <small>{notice.detail}</small>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {open === 'account' ? (
          <div className="welcome__popover" id="account-panel" role="region" aria-label="Konto użytkownika">
            <h2>Konto</h2>
            <ul>
              <li>Preview Reviewer</li>
              <li>Onsaldo Preview Sp. z o.o.</li>
              <li>Podgląd demonstracyjny</li>
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  )
}
