import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { AreaId } from '../ledger/types.ts'
import { AccountingAreas } from './AccountingAreas.tsx'

function Harness() {
  const [area, setArea] = useState<AreaId>('vat')
  return <AccountingAreas activeArea={area} onAreaChange={setArea} onOpenVat={() => setArea('vat')} />
}

describe('AccountingAreas', () => {
  it('shows the accounting map and the open period', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Obszary księgowe' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Okres księgowy · 2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wymaga konfiguracji' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('filters the area cards and toggles the period ring', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(
      screen.getByText('Rejestr jest dostępny jako podgląd. Zapisy poniżej pozostają demonstracyjne.'),
    ).toBeInTheDocument()
    expect(screen.getByText('KPiR')).toBeInTheDocument()

    const periodButton = screen.getByRole('button', { name: 'Wymaga konfiguracji' })
    expect(periodButton).toHaveAttribute('aria-pressed', 'false')
    await user.click(periodButton)
    expect(periodButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('tab', { name: 'Kontrole' }))
    expect(screen.getByRole('tab', { name: 'Kontrole' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.queryByText('KPiR')).not.toBeInTheDocument()
    expect(
      screen.getByText('Kontrole pokazują gotowość warunków i nie wysyłają danych.'),
    ).toBeInTheDocument()
  })
})