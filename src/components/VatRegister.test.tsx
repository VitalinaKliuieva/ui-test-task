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
    expect(screen.getByRole('button', { name: 'Liczba zapisów na stronie' })).toHaveTextContent(
      '10 na stronie',
    )
  })

  it('pages, searches, filters to an empty month, and opens a row', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'Następna strona' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 11' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()
    expect(screen.getByText('11–14 z 14 zapisów')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Wyczyść filtry' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Szukaj' }), 'Alfa 03')
    expect(screen.getByRole('button', { name: 'Wyczyść filtry' })).toBeEnabled()
    expect(screen.getByRole('cell', { name: 'KOR/3/10/2026/DEMO' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 11' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Szczegóły Demo Alfa 03' }))
    expect(screen.getByText(/Stawka 23%/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Więcej' }))
    await user.click(screen.getByRole('button', { name: 'Odśwież podgląd' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filtry' }))
    await user.selectOptions(screen.getByLabelText('Miesiąc'), '1')
    await user.click(screen.getByRole('button', { name: 'Zastosuj' }))
    expect(screen.getByText('Brak zapisów dla wybranego okresu.')).toBeInTheDocument()
    expect(screen.queryByText('1–10 z 14 zapisów')).not.toBeInTheDocument()
    const totals = document.querySelector('.vat__totals')?.textContent?.replace(/\s/g, ' ')
    expect(totals).toContain(formatMoney(0))

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
    await user.click(screen.getByRole('radio', { name: 'Korekta' }))

    expect(invoice).toHaveClass('is-correction')
    expect(screen.getByRole('cell', { name: 'KOR/1/10/2026/DEMO' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Faktura' }))
    expect(invoice).not.toHaveClass('is-correction')
    expect(screen.getByRole('cell', { name: 'FV/1/10/2026/DEMO' })).toBeInTheDocument()
  })

  it('keeps a correction on its own row and limits sales operations', async () => {
    const user = userEvent.setup()
    renderRegister()

    const correction = screen.getByRole('cell', { name: 'Demo Alfa 03' }).closest('tr')
    expect(correction).toHaveClass('is-correction')

    await user.click(screen.getByRole('button', { name: 'Filtry' }))
    const operation = screen.getByRole('combobox', { name: /Rodzaj operacji/ })
    expect(within(operation).queryByRole('option', { name: 'Zakup' })).not.toBeInTheDocument()
    expect(within(operation).getByRole('option', { name: 'Faktura' })).toBeInTheDocument()
    expect(within(operation).getByRole('option', { name: 'Korekta' })).toBeInTheDocument()
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
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()
    expect(screen.getByText(formatMoney(1920))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filtry' }))
    const operation = screen.getByRole('combobox', { name: /Rodzaj operacji/ })
    expect(within(operation).getByRole('option', { name: 'Zakup' })).toBeInTheDocument()
    expect(within(operation).queryByRole('option', { name: 'Faktura' })).not.toBeInTheDocument()
  })

  it('shows the empty and error demo states', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'brak' }))
    expect(screen.getByText('Brak zapisów dla wybranego okresu.')).toBeInTheDocument()
    expect(screen.queryByText('1–10 z 14 zapisów')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'błąd' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się wczytać zapisów.')
    expect(screen.getByRole('searchbox', { name: 'Szukaj' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 01' })).toBeInTheDocument()
  })

  it('hides a column from the menu and changes the page size', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'Więcej' }))
    await user.click(screen.getByRole('checkbox', { name: 'Identyfikator' }))
    await user.click(screen.getByRole('button', { name: 'Więcej' }))
    expect(screen.queryByRole('columnheader', { name: 'Identyfikator' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Liczba zapisów na stronie' }))
    await user.click(screen.getByRole('option', { name: '25 na stronie' }))
    expect(screen.getByRole('cell', { name: 'Demo Alfa 14' })).toBeInTheDocument()
    expect(screen.getByText('1–14 z 14 zapisów')).toBeInTheDocument()
  })

  it('sorts a column, moves it, and closes the confirmation banner', async () => {
    const user = userEvent.setup()
    renderRegister()

    expect(screen.getByText(/Kontekst VAT wymaga potwierdzenia. Poniżej/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zamknij' }))
    expect(screen.queryByText(/Kontekst VAT wymaga potwierdzenia. Poniżej/)).not.toBeInTheDocument()

    const contractor = screen.getByRole('columnheader', { name: 'Kontrahent' })
    await user.click(within(contractor).getByRole('button', { name: 'Kontrahent' }))
    await user.click(within(contractor).getByRole('button', { name: 'Kontrahent' }))
    expect(contractor).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('cell', { name: 'Demo Alfa 14' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Więcej' }))
    await user.click(screen.getByRole('button', { name: 'Niżej Kontrahent' }))
    await user.click(screen.getByRole('button', { name: 'Serie dokumentów' }))
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]).toHaveAccessibleName('Data')
    expect(headers[1]).toHaveAccessibleName('Kontrahent')
    expect(screen.getByText(/Aktywna seria demonstracyjna: DEMO/)).toBeInTheDocument()
  })

  it('removes one filter chip and leaves the other filters in place', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'Filtry' }))
    await user.selectOptions(screen.getByLabelText('Miesiąc'), '1')
    await user.selectOptions(screen.getByLabelText('Kod JPK V7'), 'K_10')
    await user.click(screen.getByRole('button', { name: 'Zastosuj' }))

    expect(screen.getByRole('button', { name: 'Usuń styczeń' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usuń K_10' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Usuń styczeń' }))
    expect(screen.queryByRole('button', { name: 'Usuń styczeń' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usuń K_10' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Demo Alfa 04' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Demo Alfa 01' })).not.toBeInTheDocument()
  })
})
