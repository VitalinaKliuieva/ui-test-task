import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ledgerEntries } from '../ledger/entries.ts'
import { formatMoney } from '../ledger/format.ts'
import { VatRegister } from './VatRegister.tsx'

function renderRegister() {
  render(<VatRegister entries={ledgerEntries} />)
}

describe('VatRegister', () => {
  it('shows the October sales preview with the screenshot totals', () => {
    renderRegister()

    expect(screen.getByRole('heading', { name: 'Rejestry i VAT' })).toBeInTheDocument()
    expect(screen.getByText('Onsaldo Preview Sp. z o.o.')).toBeInTheDocument()
    expect(screen.getByText('Wymaga potwierdzenia')).toBeInTheDocument()
    expect(screen.getByText('DEMO')).toBeInTheDocument()
    const totals = document.querySelector('.vat__totals')?.textContent?.replace(/\s/g, ' ')
    expect(totals).toContain(formatMoney(9700))
    expect(totals).toContain(formatMoney(2323))
    expect(totals).toContain('12 023,00 zł')
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'KOR/3/10/2026/DEMO' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 11' })).not.toBeInTheDocument()
    expect(screen.getByText('1–10 z 14 zapisów')).toBeInTheDocument()
  })

  it('pages, searches, filters to an empty month, and opens a row', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'Następna strona' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 11' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()
    expect(screen.getByText('11–14 z 14 zapisów')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Wyczyść filtry' })).toBeDisabled()
    await user.type(screen.getByRole('searchbox', { name: 'Szukaj' }), 'Alfa 03')
    expect(screen.getByRole('button', { name: 'Wyczyść filtry' })).toBeEnabled()
    expect(screen.getByRole('cell', { name: 'KOR/3/10/2026/DEMO' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 11' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Szczegóły Demo Alfa 03' }))
    expect(screen.getByText(/Stawka 23%/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Odśwież podgląd' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Miesiąc'), '1')
    expect(screen.getByText('Brak zapisów dla wybranego okresu.')).toBeInTheDocument()
    expect(screen.getByText('0 z 0 zapisów')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
  })

  it('changes a row to a correction and back from its details', async () => {
    const user = userEvent.setup()
    renderRegister()

    const invoice = screen.getByRole('cell', { name: 'Demo Alfa 01' }).closest('tr')
    expect(invoice).not.toHaveClass('is-correction')

    await user.click(screen.getByRole('button', { name: 'Szczegóły Demo Alfa 01' }))
    expect(screen.queryByRole('radio', { name: 'Zakup' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('combobox', { name: /Rodzaj operacji/ })).queryByRole('option', { name: 'Zakup' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Korekta' }))

    expect(invoice).toHaveClass('is-correction')
    expect(screen.getByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Faktura' }))
    expect(invoice).not.toHaveClass('is-correction')
    expect(screen.getByRole('cell', { name: 'FV/1/10/2026/DEMO' })).toBeInTheDocument()
  })

  it('switches to the purchase register', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('tab', { name: 'Rejestr VAT zakupów' }))
    const table = screen.getByRole('table', { name: 'Rejestr VAT zakupów' })
    expect(within(table).getByRole('cell', { name: 'Demo Beta 01' })).toBeInTheDocument()
    await user.click(within(table).getByRole('button', { name: 'Szczegóły Demo Beta 01' }))
    expect(screen.getByRole('radio', { name: 'Zakup' })).toBeChecked()
    expect(screen.queryByRole('radio', { name: 'Faktura' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('combobox', { name: /Rodzaj operacji/ })).getByRole('option', { name: 'Zakup' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()
    expect(screen.getByText(formatMoney(1920))).toBeInTheDocument()
  })
})
