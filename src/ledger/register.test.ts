import { describe, expect, it } from 'vitest'
import { ledgerEntries } from './entries.ts'
import {
  initialRegisterState,
  registerReducer,
  summarize,
  visibleEntries,
} from './register.ts'
import type { RegisterState } from './types.ts'

function state(patch: Partial<RegisterState>): RegisterState {
  return { ...initialRegisterState, ...patch }
}

describe('registerReducer', () => {
  it('drops a sales-only operation when the purchase register opens', () => {
    const filtered = registerReducer(initialRegisterState, { type: 'operation', value: 'Faktura' })
    const next = registerReducer(filtered, { type: 'tab', value: 'purchase' })

    expect(next.tab).toBe('purchase')
    expect(next.operation).toBe('all')
    expect(next.page).toBe(1)
  })

  it('keeps Korekta because both registers allow it', () => {
    const filtered = registerReducer(initialRegisterState, { type: 'operation', value: 'Korekta' })
    const next = registerReducer(filtered, { type: 'tab', value: 'purchase' })

    expect(next.operation).toBe('Korekta')
  })

  it('applies every filter in one step and returns to the first page', () => {
    const paged = registerReducer(initialRegisterState, { type: 'page', page: 2 })
    const next = registerReducer(paged, {
      type: 'filters',
      year: '2025',
      month: '1',
      operation: 'Korekta',
      jpkCode: 'K_10',
    })

    expect(next).toMatchObject({
      year: '2025',
      month: '1',
      operation: 'Korekta',
      jpkCode: 'K_10',
      page: 1,
      expandedId: null,
    })
  })

  it('turns the sort direction when the same column is chosen again', () => {
    const ascending = registerReducer(initialRegisterState, { type: 'sort', key: 'contractor' })
    const descending = registerReducer(ascending, { type: 'sort', key: 'contractor' })

    expect(ascending).toMatchObject({ sortKey: 'contractor', sortDirection: 'asc', page: 1 })
    expect(descending.sortDirection).toBe('desc')
  })

  it('keeps the query while paging and clears it with the other filters', () => {
    const searched = registerReducer(initialRegisterState, { type: 'search', value: 'Alfa 03' })
    const paged = registerReducer(searched, { type: 'page', page: 2 })
    const cleared = registerReducer(
      registerReducer(paged, { type: 'tab', value: 'purchase' }),
      { type: 'resetFilters' },
    )

    expect(paged).toMatchObject({ search: 'Alfa 03', page: 2 })
    expect(cleared).toMatchObject({
      tab: 'purchase',
      search: '',
      month: '10',
      operation: 'all',
      page: 1,
      sortKey: 'date',
      pageSize: 10,
      seriesOpen: false,
    })
  })

  it('clears the open row on a page change and restores the initial register', () => {
    const open = registerReducer(initialRegisterState, { type: 'toggleRow', id: 'sale-1' })
    const paged = registerReducer(open, { type: 'page', page: 2 })
    const series = registerReducer(paged, { type: 'toggleSeries' })
    const reset = registerReducer(series, { type: 'reset' })

    expect(paged).toMatchObject({ page: 2, expandedId: null })
    expect(series).toMatchObject({ page: 2, seriesOpen: true })
    expect(reset).toEqual(initialRegisterState)
  })

  it('opens a row and closes it on the second toggle', () => {
    const open = registerReducer(initialRegisterState, { type: 'toggleRow', id: 'sale-1' })
    const closed = registerReducer(open, { type: 'toggleRow', id: 'sale-1' })

    expect(open.expandedId).toBe('sale-1')
    expect(closed.expandedId).toBeNull()
  })
})

describe('visibleEntries', () => {
  it('returns the October sales rows in date order', () => {
    const rows = visibleEntries(ledgerEntries, initialRegisterState)

    expect(rows).toHaveLength(14)
    expect(rows[0]?.contractor).toBe('Demo Alfa 01')
    expect(rows[2]?.documentNumber).toBe('KOR/3/10/2026/DEMO')
    expect(rows.at(-1)?.contractor).toBe('Demo Alfa 14')
  })

  it('matches the search across the contractor and the document number', () => {
    const byContractor = visibleEntries(ledgerEntries, state({ search: 'alfa 03' }))
    const byDocument = visibleEntries(ledgerEntries, state({ search: 'KOR/3' }))

    expect(byContractor.map((row) => row.id)).toEqual(['sale-3'])
    expect(byDocument.map((row) => row.id)).toEqual(['sale-3'])
    expect(visibleEntries(ledgerEntries, state({ search: ' DEMO-S-4 ' })).map((row) => row.id)).toEqual([
      'sale-4',
    ])
    expect(visibleEntries(ledgerEntries, state({ search: 'potwierdzenia' }))).toHaveLength(14)
    expect(visibleEntries(ledgerEntries, state({ year: '2025' }))).toEqual([])
  })

  it('limits the rows to the selected operation, month, and JPK code', () => {
    expect(visibleEntries(ledgerEntries, state({ operation: 'Korekta' })).map((row) => row.id)).toEqual([
      'sale-3',
    ])
    expect(visibleEntries(ledgerEntries, state({ month: '1' }))).toEqual([])
    expect(visibleEntries(ledgerEntries, state({ jpkCode: 'K_10' })).map((row) => row.id)).toEqual([
      'sale-4',
    ])
    expect(visibleEntries(ledgerEntries, state({ tab: 'purchase' }))).toHaveLength(4)
  })

  it('sorts contractors descending without changing the source list', () => {
    const rows = visibleEntries(
      ledgerEntries,
      state({ sortKey: 'contractor', sortDirection: 'desc' }),
    )

    expect(rows[0]?.contractor).toBe('Demo Alfa 14')
    expect(ledgerEntries[0]?.contractor).toBe('Demo Alfa 01')
  })
})

describe('summarize', () => {
  it('totals the October sales preview', () => {
    const summary = summarize(visibleEntries(ledgerEntries, initialRegisterState))

    expect(summary).toMatchObject({ net: 9700, vat: 2323, gross: 12023 })
    expect(summary.byRate.get('23%')).toBe(2323)
  })

  it('returns zeros for an empty list', () => {
    const summary = summarize([])

    expect(summary).toMatchObject({ net: 0, vat: 0, gross: 0 })
    expect(summary.byRate.size).toBe(0)
  })
})
