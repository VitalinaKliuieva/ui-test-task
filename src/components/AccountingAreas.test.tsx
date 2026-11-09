import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { AreaId } from '../ledger/types.ts'
import { AccountingAreas } from './AccountingAreas.tsx'

function Harness() {
  const [area, setArea] = useState<AreaId>('vat')
  return <AccountingAreas activeArea={area} onAreaChange={setArea} />
}

describe('AccountingAreas', () => {
  it('shows the accounting map and the configuration warning', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Obszary księgowe' })).toBeInTheDocument()
    expect(screen.getByText('Okres księgowy · 2026')).toBeInTheDocument()
    expect(screen.getByText('Wymaga konfiguracji')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('expands an area and switches the active section', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Rejestr VAT' }))
    expect(
      screen.getByText('Rejestr jest dostępny jako podgląd. Zapisy poniżej pozostają demonstracyjne.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Kontrole' }))
    expect(screen.getByRole('tab', { name: 'Kontrole' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })
})
