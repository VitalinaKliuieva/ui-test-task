import { Fragment, useReducer, useState } from 'react'
import type { CSSProperties } from 'react'
import { MONTHS, PAGE_SIZES, YEARS, formatMoney } from '../ledger/format.ts'
import {
  REGISTER_OPERATIONS,
  initialRegisterState,
  registerReducer,
  summarize,
  visibleEntries,
} from '../ledger/register.ts'
import type { RegisterKind, SortKey, VatEntry, VatRate } from '../ledger/types.ts'
import { Icon } from './Icon.tsx'
import './VatRegister.css'

const COLUMNS: readonly { key: SortKey; label: string }[] = [
  { key: 'contractor', label: 'Kontrahent' },
  { key: 'date', label: 'Data' },
  { key: 'documentNumber', label: 'Numer dokumentu' },
  { key: 'ksefStatus', label: 'Numer KSeF' },
  { key: 'identifier', label: 'Identyfikator' },
]

const JPK_CODES = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'K_19', label: 'K_19' },
  { value: 'K_10', label: 'K_10' },
] as const

const RATES: readonly VatRate[] = ['23%', 'np']

function operationsFor(register: RegisterKind): readonly VatEntry['operation'][] {
  return REGISTER_OPERATIONS[register]
}

const DOCUMENT_PREFIX: Record<VatEntry['operation'], string> = {
  Korekta: 'KOR',
  Faktura: 'FV',
  Zakup: 'FZ',
}

function withOperation(entry: VatEntry, operation: VatEntry['operation']): VatEntry {
  if (operation === entry.operation || !operationsFor(entry.register).includes(operation)) return entry
  return {
    ...entry,
    operation,
    documentNumber: entry.documentNumber.replace(/^(KOR|FV|FZ)/, DOCUMENT_PREFIX[operation]),
  }
}

type VatRegisterProps = {
  entries: readonly VatEntry[]
  year?: string
  month?: string
  onPeriodChange?: (period: { year: string; month: string }) => void
}

function entriesToCsv(entries: readonly VatEntry[]): string {
  const header = [
    'Kontrahent',
    'Data',
    'Numer dokumentu',
    'Numer KSeF',
    'Identyfikator',
    'Netto',
    'VAT',
    'Brutto',
  ]
  const rows = entries.map((entry) =>
    [
      entry.contractor,
      entry.date,
      entry.documentNumber,
      entry.ksefStatus,
      entry.identifier,
      entry.net,
      entry.vat,
      entry.gross,
    ].join(';'),
  )
  return [header.join(';'), ...rows].join('\n')
}

function downloadCsv(entries: readonly VatEntry[]) {
  const blob = new Blob([entriesToCsv(entries)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rejestr-vat-demo.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function VatRegister({ entries, year: yearProp, month: monthProp, onPeriodChange }: VatRegisterProps) {
  const [state, dispatch] = useReducer(registerReducer, initialRegisterState)
  const [operations, setOperations] = useState<Record<string, VatEntry['operation']>>({})
  const year = yearProp ?? state.year
  const month = monthProp ?? state.month
  const resolved = entries.map((entry) => withOperation(entry, operations[entry.id] ?? entry.operation))
  const ordered = visibleEntries(resolved, { ...state, year, month })
  const summary = summarize(ordered)
  const pageCount = Math.max(1, Math.ceil(ordered.length / state.pageSize))
  const page = Math.min(state.page, pageCount)
  const start = (page - 1) * state.pageSize
  const pageRows = ordered.slice(start, start + state.pageSize)
  const from = ordered.length === 0 ? 0 : start + 1
  const to = Math.min(start + state.pageSize, ordered.length)
  const rangeLabel =
    ordered.length === 0 ? '0 z 0 zapisów' : `${from}–${to} z ${ordered.length} zapisów`
  const tabLabel = state.tab === 'sale' ? 'Rejestr VAT sprzedaży' : 'Rejestr VAT zakupów'
  const rowOperations = operationsFor(state.tab)
  const operationFilters = ['all' as const, ...rowOperations]
  const filtersActive =
    state.search.length > 0 ||
    year !== initialRegisterState.year ||
    month !== initialRegisterState.month ||
    state.operation !== initialRegisterState.operation ||
    state.jpkCode !== initialRegisterState.jpkCode

  return (
    <section className={state.compact ? 'card vat is-compact' : 'card vat'} aria-labelledby="vat-title">
      <header className="vat__header">
        <div>
          <p className="vat__company">Onsaldo Preview Sp. z o.o.</p>
          <h2 id="vat-title">Rejestry i VAT</h2>
          <p className="lede">
            Sprzedaż i zakupy w wybranym okresie — podgląd danych demonstracyjnych.
          </p>
        </div>
        <div className="vat__status">
          <p className="vat__confirm">Wymaga potwierdzenia</p>
          <p className="vat__demo">DEMO</p>
        </div>
      </header>

      <div className="vat__tabs" role="tablist" aria-label="Rodzaj rejestru VAT">
        <button
          type="button"
          role="tab"
          className={state.tab === 'sale' ? 'vat__tab is-active' : 'vat__tab'}
          aria-selected={state.tab === 'sale'}
          onClick={() => dispatch({ type: 'tab', value: 'sale' })}
        >
          <Icon name="document" />
          Rejestr VAT sprzedaży
        </button>
        <button
          type="button"
          role="tab"
          className={state.tab === 'purchase' ? 'vat__tab is-active' : 'vat__tab'}
          aria-selected={state.tab === 'purchase'}
          onClick={() => dispatch({ type: 'tab', value: 'purchase' })}
        >
          <Icon name="document" />
          Rejestr VAT zakupów
        </button>
      </div>

      <div className="notice">
        <Icon name="info" />
        <p>
          Kontekst VAT wymaga potwierdzenia. Poniżej wyłącznie dane demonstracyjne, nie ewidencja
          organizacji.
        </p>
      </div>

      <form className="vat__search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="vat__search-field">
          <span className="sr-only">Szukaj</span>
          <Icon name="search" />
          <input
            type="search"
            placeholder="Szukaj"
            value={state.search}
            onChange={(event) => dispatch({ type: 'search', value: event.target.value })}
          />
        </label>
        <div className="vat__tools">
          <button type="button" className="vat__icon-button" aria-label="Drukuj rejestr" onClick={() => window.print()}>
            <Icon name="print" />
          </button>
          <button type="button" className="vat__icon-button" aria-label="Pobierz CSV" onClick={() => downloadCsv(ordered)}>
            <Icon name="download" />
          </button>
          <button
            type="button"
            className="vat__icon-button"
            aria-label="Odśwież podgląd"
            onClick={() => {
              dispatch({ type: 'reset' })
              setOperations({})
              onPeriodChange?.({
                year: initialRegisterState.year,
                month: initialRegisterState.month,
              })
            }}
          >
            <Icon name="refresh" />
          </button>
          <span className="vat__tool-divider" aria-hidden="true" />
          <button
            type="button"
            className="vat__icon-button"
            aria-expanded={state.seriesOpen}
            aria-label="Serie dokumentów"
            onClick={() => dispatch({ type: 'toggleSeries' })}
          >
            <Icon name="tag" />
          </button>
          <button
            type="button"
            className="vat__icon-button"
            aria-pressed={state.compact}
            aria-label={state.compact ? 'Pokaż wygodny widok' : 'Pokaż zwarty widok'}
            onClick={() => dispatch({ type: 'toggleCompact' })}
          >
            <Icon name="expand" />
          </button>
        </div>
      </form>

      <div className="vat__filters">
        <div className="vat__filter-grid">
          <label className="field">
            Rok
            <select
              value={year}
              onChange={(event) => {
                const value = event.target.value
                dispatch({ type: 'year', value })
                onPeriodChange?.({ year: value, month })
              }}
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Miesiąc
            <select
              value={month}
              onChange={(event) => {
                const value = event.target.value
                dispatch({ type: 'month', value })
                onPeriodChange?.({ year, month: value })
              }}
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Rodzaj operacji
            <select
              value={state.operation}
              onChange={(event) => dispatch({ type: 'operation', value: event.target.value })}
            >
              {operationFilters.map((operation) => (
                <option key={operation} value={operation}>
                  {operation === 'all' ? 'Wszystkie' : operation}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Kod JPK V7
            <select
              value={state.jpkCode}
              onChange={(event) => dispatch({ type: 'jpkCode', value: event.target.value })}
            >
              {JPK_CODES.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="vat__filter-foot">
          <button
            type="button"
            className="vat__series-button"
            aria-expanded={state.seriesOpen}
            onClick={() => dispatch({ type: 'toggleSeries' })}
          >
            <Icon name="series" />
            Serie dokumentów
          </button>
          <button
            type="button"
            className="vat__clear"
            aria-label="Wyczyść filtry"
            disabled={!filtersActive}
            onClick={() => {
              dispatch({ type: 'resetFilters' })
              onPeriodChange?.({
                year: initialRegisterState.year,
                month: initialRegisterState.month,
              })
            }}
          >
            <Icon name="filter" />
          </button>
        </div>
        {state.seriesOpen ? (
          <p className="vat__series">
            Aktywna seria demonstracyjna: DEMO. Serie nie tworzą zapisów w ewidencji organizacji.
          </p>
        ) : null}
      </div>

      <dl className="vat__totals">
        <div>
          <dt>Netto</dt>
          <dd>{formatMoney(summary.net)}</dd>
        </div>
        <div>
          <dt>VAT</dt>
          <dd>{formatMoney(summary.vat)}</dd>
        </div>
        <div>
          <dt>Brutto</dt>
          <dd>{formatMoney(summary.gross)}</dd>
        </div>
      </dl>

      <p className="vat__rates-label">
        Kwoty według stawek VAT
        <span>VAT · DEMO</span>
      </p>
      {RATES.map((rate) => {
        const amount = summary.byRate.get(rate) ?? 0
        const width = summary.vat === 0 ? 0 : Math.round((amount / summary.vat) * 100)
        return (
          <div className="vat__rate" key={rate}>
            <span className={rate === 'np' ? 'vat__rate-label is-quiet' : 'vat__rate-label'}>{rate}</span>
            <span className="vat__track" aria-hidden="true">
              <span
                className={rate === 'np' ? 'vat__fill is-quiet' : 'vat__fill'}
                style={{ '--fill': `${width}%` } as CSSProperties}
              />
            </span>
            <span className="vat__rate-amount">{formatMoney(amount)}</span>
          </div>
        )
      })}

      <div className="vat__table-wrap">
        <table className="vat__table">
          <caption className="sr-only">{tabLabel}</caption>
          <thead>
            <tr>
              {COLUMNS.map((column) => {
                const active = state.sortKey === column.key
                const direction = active && state.sortDirection === 'desc' ? 'descending' : 'ascending'
                return (
                  <th key={column.key} scope="col" aria-sort={active ? direction : 'none'}>
                    <button type="button" className="vat__sort" onClick={() => dispatch({ type: 'sort', key: column.key })}>
                      <span className="vat__grip" aria-hidden="true" />
                      {column.label}
                    </button>
                  </th>
                )
              })}
              <th scope="col">
                <span className="sr-only">Szczegóły</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="vat__empty" colSpan={6}>
                  Brak zapisów dla wybranego okresu.
                </td>
              </tr>
            ) : (
              pageRows.map((entry) => {
                const open = state.expandedId === entry.id
                const correction = entry.operation === 'Korekta'
                return (
                  <Fragment key={entry.id}>
                    <tr className={correction ? 'is-correction' : undefined}>
                      <td>
                        {entry.contractor}
                        <span className={correction ? 'vat__op is-correction' : 'vat__op'} aria-hidden="true">
                          {entry.operation}
                        </span>
                      </td>
                      <td className="vat__mono">{entry.date}</td>
                      <td className="vat__mono">{entry.documentNumber}</td>
                      <td>
                        <span className="vat__ksef">
                          <span className="vat__dot" aria-hidden="true" />
                          {entry.ksefStatus}
                        </span>
                      </td>
                      <td className="vat__mono">{entry.identifier}</td>
                      <td>
                        <button
                          type="button"
                          className={open ? 'vat__row-button is-open' : 'vat__row-button'}
                          aria-expanded={open}
                          aria-label={`Szczegóły ${entry.contractor}`}
                          onClick={() => dispatch({ type: 'toggleRow', id: entry.id })}
                        >
                          <Icon name="chevron" />
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className={correction ? 'vat__detail is-correction' : 'vat__detail'}>
                        <td colSpan={6}>
                          <p>
                            Stawka {entry.rate}. Netto {formatMoney(entry.net)}. VAT {formatMoney(entry.vat)}.
                            Brutto {formatMoney(entry.gross)}.
                          </p>
                          <div className="vat__ops" role="radiogroup" aria-label="Rodzaj operacji">
                            {rowOperations.map((operation) => {
                              const selected = entry.operation === operation
                              return (
                                <button
                                  key={operation}
                                  type="button"
                                  role="radio"
                                  className={selected ? 'vat__op-choice is-selected' : 'vat__op-choice'}
                                  aria-checked={selected}
                                  onClick={() =>
                                    setOperations((current) => ({
                                      ...current,
                                      [entry.id]: operation,
                                    }))
                                  }
                                >
                                  {operation}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="vat__footer">
        <p aria-live="polite">{rangeLabel}</p>
        <div className="vat__pager">
          <button
            type="button"
            className="vat__page-button vat__page-button--prev"
            aria-label="Poprzednia strona"
            disabled={page <= 1}
            onClick={() => dispatch({ type: 'page', page: page - 1 })}
          >
            <Icon name="chevron" />
          </button>
          <span className="vat__page-label">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            className="vat__page-button vat__page-button--next"
            aria-label="Następna strona"
            disabled={page >= pageCount}
            onClick={() => dispatch({ type: 'page', page: page + 1 })}
          >
            <Icon name="chevron" />
          </button>
          <label>
            <span className="sr-only">Liczba zapisów na stronie</span>
            <select
              className="vat__page-size"
              value={state.pageSize}
              onChange={(event) =>
                dispatch({ type: 'pageSize', pageSize: Number(event.target.value) })
              }
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} na stronie
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
