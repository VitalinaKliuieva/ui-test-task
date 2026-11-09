import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { WelcomeBar } from './WelcomeBar.tsx'

function Harness() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  return (
    <WelcomeBar
      theme={theme}
      onThemeToggle={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
    />
  )
}

describe('WelcomeBar', () => {
  it('shows the greeting, the account, and four notices', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByText('Witaj, Preview Reviewer!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Konto użytkownika/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Powiadomienia, 4 nowe' }))
    expect(screen.getByText('Kontekst VAT wymaga potwierdzenia')).toBeInTheDocument()
    expect(screen.getByText('Brak potwierdzenia KSeF dla serii DEMO')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('opens the account menu and toggles the theme', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /Konto użytkownika/ }))
    expect(screen.getByText('Onsaldo Preview Sp. z o.o.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Włącz ciemny motyw' }))
    expect(screen.getByRole('button', { name: 'Włącz jasny motyw' })).toBeInTheDocument()
  })
})
