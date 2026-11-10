import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('combines the accounting map and the VAT register on one page', () => {
    render(<App />)

    expect(screen.getByText('Witaj, Preview Reviewer!')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Obszary księgowe' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Rejestry i VAT' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
  })

  it('replaces the register when another accounting area is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Księgowania' }))

    expect(screen.getByRole('heading', { name: 'Księgowania' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rejestry i VAT' })).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Obszar księgowań pozostaje demonstracyjny. Uruchomienie wymaga potwierdzenia konfiguracji.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Włącz ciemny motyw' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('filters area cards and opens the VAT register from its card', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Okres księgowy · 2026' })).toBeInTheDocument()
    expect(screen.getByText('KPiR')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wymaga konfiguracji' }))
    expect(screen.getByRole('button', { name: 'Wymaga konfiguracji' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /Rejestr VAT/ }))
    expect(screen.getByRole('heading', { name: 'Rejestry i VAT' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
  })
})
