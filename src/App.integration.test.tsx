import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('page flow', () => {
  it('keeps a row correction when the person leaves the register and comes back', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Witaj, Preview Reviewer!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Powiadomienia, 4 nowe' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)

    await user.click(screen.getByRole('tab', { name: 'Majątek' }))
    expect(screen.getByRole('heading', { name: 'Majątek' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Rejestry i VAT' }))
    await user.click(screen.getByRole('button', { name: 'Szczegóły Demo Alfa 01' }))
    await user.click(screen.getByRole('radio', { name: 'Korekta' }))
    expect(screen.getByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Rejestr VAT zakupów' }))
    expect(screen.getByRole('cell', { name: 'Demo Beta 01' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Rejestr VAT sprzedaży' }))
    expect(screen.getByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'błąd' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się wczytać zapisów.')
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(screen.getByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Włącz ciemny motyw' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('tab', { name: 'Kontrole' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.queryByRole('heading', { name: 'Rejestry i VAT' })).not.toBeInTheDocument()
  })

  it('applies a period filter from the page and removes it with the chip', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Filtry' }))
    await user.selectOptions(screen.getByLabelText('Miesiąc'), '1')
    await user.click(screen.getByRole('button', { name: 'Zastosuj' }))

    expect(screen.getByText('Brak zapisów dla wybranego okresu.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Obszary księgowe' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Usuń styczeń' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
  })
})
