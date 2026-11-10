import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Icon } from './Icon.tsx'
import { ledgerEntries } from '../ledger/entries.ts'
import { formatMoney, MONTHS, PAGE_SIZES, YEARS } from '../ledger/format.ts'
import {
  initialRegisterState,
  REGISTER_OPERATIONS,
  registerReducer,
  summarize,
  visibleEntries,
} from '../ledger/register.ts'
import type { RegisterKind, SortKey, VatEntry, VatRate } from '../ledger/types.ts'
import './VatRegister.css'

const COLUMNS: readonly { key: SortKey; label: string }[] = [
  { key: 'contractor', label: 'Kontrahent' },
  { key: 'date', label: 'Data' },
  { key: 'documentNumber', label: 'Numer dokumentu' },
  { key: 'ksefStatus', label: 'Numer KSeF' },
  { key: 'identifier', label: 'Identyfikator' },
]

const COLUMN_LABEL = Object.fromEntries(
  COLUMNS.map((column) => [column.key, column.label]),
) as Record<SortKey, string>

const RATES: readonly VatRate[] = ['23%', 'np']

const DOCUMENT_PREFIX: Record<VatEntry['operation'], string> = {
  Korekta: 'KOR',
  Faktura: 'FV',
  Zakup: 'FZ',
}

function withOperation(entry: VatEntry, operation: VatEntry['operation']): VatEntry {
  if (operation === entry.operation || !REGISTER_OPERATIONS[entry.register].includes(operation)) {
    return entry
  }
  return {
    ...entry,
    operation,
    documentNumber: entry.documentNumber.replace(/^(KOR|FV|FZ)/, DOCUMENT_PREFIX[operation]),
  }
}

const TAB_LABEL: Record<RegisterKind, string> = {
  sale: 'Rejestr VAT sprzedaży',
  purchase: 'Rejestr VAT zakupów',
}

type ViewState = 'data' | 'empty' | 'error'
type ChipId = 'search' | 'year' | 'month' | 'operation' | 'jpkCode'

type Draft = {
  year: string
  month: string
  operation: string
  jpkCode: string
}

const instant = import.meta.env.MODE === 'test'

const PHONE_QUERY = '(max-width: 767px)'
const TABLET_QUERY = '(max-width: 1100px)'

function readBreakpoints(): { phone: boolean; tablet: boolean } {
  if (typeof window.matchMedia !== 'function') return { phone: false, tablet: false }
  return {
    phone: window.matchMedia(PHONE_QUERY).matches,
    tablet: window.matchMedia(TABLET_QUERY).matches,
  }
}

function useBreakpoints(): { phone: boolean; tablet: boolean } {
  const [matches, setMatches] = useState(readBreakpoints)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const phoneQuery = window.matchMedia(PHONE_QUERY)
    const tabletQuery = window.matchMedia(TABLET_QUERY)
    const apply = () =>
      setMatches((current) => {
        const next = { phone: phoneQuery.matches, tablet: tabletQuery.matches }
        return current.phone === next.phone && current.tablet === next.tablet ? current : next
      })
    phoneQuery.addEventListener('change', apply)
    tabletQuery.addEventListener('change', apply)
    return () => {
      phoneQuery.removeEventListener('change', apply)
      tabletQuery.removeEventListener('change', apply)
    }
  }, [])

  return matches
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
  if (typeof URL.createObjectURL !== 'function') return
  const blob = new Blob([entriesToCsv(entries)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rejestr-vat-demo.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function columnLabel(key: SortKey): string {
  return COLUMN_LABEL[key]
}

export function VatRegister({ entries = ledgerEntries }: { entries?: readonly VatEntry[] }) {
  const [state, dispatch] = useReducer(registerReducer, initialRegisterState)
  const [view, setView] = useState<ViewState>('data')
  const [bannerOn, setBannerOn] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pageSizeOpen, setPageSizeOpen] = useState(false)
  const [operationOverrides, setOperationOverrides] = useState<
    Record<string, VatEntry['operation']>
  >({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [order, setOrder] = useState<SortKey[]>(COLUMNS.map((column) => column.key))
  const [hidden, setHidden] = useState<SortKey[]>([])
  const [columnsTouched, setColumnsTouched] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    year: initialRegisterState.year,
    month: initialRegisterState.month,
    operation: initialRegisterState.operation,
    jpkCode: initialRegisterState.jpkCode,
  })
  const rootRef = useRef<HTMLElement>(null)
  const timer = useRef<number | null>(null)
  const { phone, tablet } = useBreakpoints()
  const toggleRow = useCallback((id: string) => {
    dispatch({ type: 'toggleRow', id })
  }, [])
  const changeOperation = useCallback((id: string, operation: VatEntry['operation']) => {
    setOperationOverrides((current) => ({ ...current, [id]: operation }))
  }, [])

  useEffect(() => {
    if (columnsTouched) return
    const next: SortKey[] = tablet && !phone ? ['identifier'] : []
    setHidden((current) =>
      current.length === next.length && current.every((key, index) => key === next[index])
        ? current
        : next,
    )
  }, [columnsTouched, phone, tablet])

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setFiltersOpen(false)
      setMenuOpen(false)
      setPageSizeOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function settle(apply: () => void) {
    if (instant) {
      apply()
      return
    }
    if (timer.current !== null) window.clearTimeout(timer.current)
    setLoading(true)
    timer.current = window.setTimeout(() => {
      apply()
      setLoading(false)
      timer.current = null
    }, 420)
  }

  const resolved = useMemo(
    () =>
      Object.keys(operationOverrides).length === 0
        ? entries
        : entries.map((entry) =>
            withOperation(entry, operationOverrides[entry.id] ?? entry.operation),
          ),
    [entries, operationOverrides],
  )
  const ordered = useMemo(() => visibleEntries(resolved, state), [resolved, state])
  const pageCount = Math.max(1, Math.ceil(ordered.length / state.pageSize))
  const page = Math.min(state.page, pageCount)
  const start = (page - 1) * state.pageSize
  const pageRows = ordered.slice(start, start + state.pageSize)
  const hiddenSet = useMemo(() => new Set(hidden), [hidden])
  const visibleKeys = useMemo(
    () => order.filter((key) => !hiddenSet.has(key)),
    [order, hiddenSet],
  )
  const summary = useMemo(
    () => summarize(view === 'empty' || ordered.length === 0 ? [] : ordered),
    [ordered, view],
  )
  const rateMax = Math.max(1, ...RATES.map((rate) => summary.byRate.get(rate) ?? 0))
  const operations = REGISTER_OPERATIONS[state.tab]
  const listReplaced = view !== 'data' || ordered.length === 0
  const showPager = view === 'data' && ordered.length > 0

  const chips: { id: ChipId; label: string }[] = []
  if (state.year !== initialRegisterState.year) chips.push({ id: 'year', label: state.year })
  if (state.month !== initialRegisterState.month) {
    const month = MONTHS.find((item) => item.value === state.month)
    chips.push({ id: 'month', label: month?.label ?? state.month })
  }
  if (state.operation !== 'all') chips.push({ id: 'operation', label: state.operation })
  if (state.jpkCode !== 'all') chips.push({ id: 'jpkCode', label: state.jpkCode })
  if (state.search.trim().length > 0) chips.push({ id: 'search', label: state.search.trim() })

  const filterCount = chips.filter((chip) => chip.id !== 'search').length
  const showChipClear = chips.length > 0 && !listReplaced
  const showEmptyClear = listReplaced && view !== 'error'
  const fillApply = view !== 'error'

  function openFilters() {
    setDraft({
      year: state.year,
      month: state.month,
      operation: operations.includes(state.operation as VatEntry['operation'])
        ? state.operation
        : 'all',
      jpkCode: state.jpkCode,
    })
    setFiltersOpen(true)
    setMenuOpen(false)
  }

  function applyFilters() {
    const next = draft
    setFiltersOpen(false)
    settle(() => {
      dispatch({
        type: 'filters',
        year: next.year,
        month: next.month,
        operation: next.operation,
        jpkCode: next.jpkCode,
      })
    })
  }

  function clearFilters() {
    setFiltersOpen(false)
    setDraft({
      year: initialRegisterState.year,
      month: initialRegisterState.month,
      operation: 'all',
      jpkCode: 'all',
    })
    settle(() => {
      dispatch({ type: 'resetFilters' })
      setView('data')
    })
  }

  function removeChip(id: ChipId) {
    const value =
      id === 'year'
        ? initialRegisterState.year
        : id === 'month'
          ? initialRegisterState.month
          : id === 'search'
            ? ''
            : 'all'
    settle(() => dispatch({ type: id, value }))
  }

  function moveColumn(key: SortKey, direction: -1 | 1) {
    setColumnsTouched(true)
    setOrder((current) => {
      const index = current.indexOf(key)
      const next = index + direction
      if (index < 0 || next < 0 || next >= current.length) return current
      const copy = current.slice()
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
  }

  function toggleColumn(key: SortKey) {
    setColumnsTouched(true)
    setHidden((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key)
      const shown = order.filter((item) => !current.includes(item))
      if (shown.length <= 1) return current
      return [...current, key]
    })
  }

  function printRegister() {
    setMenuOpen(false)
    setStatus('Drukuj rejestr')
    if (typeof window.print === 'function') window.print()
  }

  function exportCsv() {
    setMenuOpen(false)
    downloadCsv(ordered)
    setStatus('Pobierz CSV')
  }

  const range =
    ordered.length === 0
      ? '0 z 0 zapisów'
      : `${start + 1}–${Math.min(start + state.pageSize, ordered.length)} z ${ordered.length} zapisów`

  return (
    <section className="card vat" aria-labelledby="vat-title" ref={rootRef}>
      <div className="vat__head">
        <div className="vat__intro">
          <p className="vat__company">Onsaldo Preview Sp. z o.o.</p>
          <h2 id="vat-title">Rejestry i VAT</h2>
          <p className="vat__lede">
            Sprzedaż i zakupy w wybranym okresie — podgląd danych demonstracyjnych.
          </p>
          <div className="vat__badges">
            <span className="badge badge-warn">Wymaga potwierdzenia</span>
            <span className="badge badge-demo">DEMO</span>
          </div>
        </div>
        <div className="vat__state" role="group" aria-label="Stan">
          <span>Stan</span>
          {(
            [
              ['data', 'dane'],
              ['empty', 'brak'],
              ['error', 'błąd'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="btn-ghost"
              aria-pressed={view === value}
              onClick={() => {
                setView(value)
                setLoading(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="vat__tabs" role="tablist" aria-label="Rodzaj rejestru VAT">
        {(Object.keys(TAB_LABEL) as RegisterKind[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={state.tab === tab}
            onClick={() => {
              setMenuOpen(false)
              settle(() => dispatch({ type: 'tab', value: tab }))
            }}
          >
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      {bannerOn ? (
        <p className="notice vat__banner">
          <Icon name="info" />
          <span>
            Kontekst VAT wymaga potwierdzenia. Poniżej wyłącznie dane demonstracyjne, nie
            ewidencja organizacji.
          </span>
          <button type="button" className="btn-ghost" aria-label="Zamknij" onClick={() => setBannerOn(false)}>
            ×
          </button>
        </p>
      ) : null}

      <div className="vat__toolbar">
        <label className="vat__search">
          <span className="sr-only">Szukaj</span>
          <Icon name="search" />
          <input
            type="search"
            aria-label="Szukaj"
            placeholder="Szukaj"
            value={state.search}
            onChange={(event) => dispatch({ type: 'search', value: event.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-line"
          aria-label="Filtry"
          aria-expanded={filtersOpen}
          onClick={() => (filtersOpen ? setFiltersOpen(false) : openFilters())}
        >
          <Icon name="filter" />
          Filtry
          {filterCount > 0 ? <span className="vat__count">{filterCount}</span> : null}
        </button>
        <button
          type="button"
          className="btn-line vat__desktop-only"
          aria-label="Drukuj rejestr"
          onClick={printRegister}
        >
          <Icon name="print" />
        </button>
        <button
          type="button"
          className="btn-line vat__desktop-only"
          aria-label="Pobierz CSV"
          onClick={exportCsv}
        >
          <Icon name="download" />
        </button>
        <button
          type="button"
          className="btn-line"
          aria-label="Więcej"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open)
            setFiltersOpen(false)
          }}
        >
          ⋯
        </button>

        {menuOpen ? (
          <div className="vat__menu" role="group" aria-label="Więcej">
            <button
              type="button"
              className="btn-ghost"
              aria-pressed={state.seriesOpen}
              onClick={() => {
                dispatch({ type: 'toggleSeries' })
                setStatus('Serie dokumentów')
              }}
            >
              <Icon name="series" />
              Serie dokumentów
            </button>
            {phone ? (
              <>
                <button type="button" className="btn-ghost" onClick={printRegister}>
                  <Icon name="print" />
                  Drukuj rejestr
                </button>
                <button type="button" className="btn-ghost" onClick={exportCsv}>
                  <Icon name="download" />
                  Pobierz CSV
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMenuOpen(false)
                setStatus('Odśwież podgląd')
                settle(() => {
                  dispatch({ type: 'reset' })
                  setOperationOverrides({})
                  setView('data')
                  setHidden([])
                  setOrder(COLUMNS.map((column) => column.key))
                  setColumnsTouched(false)
                })
              }}
            >
              <Icon name="refresh" />
              Odśwież podgląd
            </button>
            <div className="vat__columns" aria-label="Kolumny">
              {order.map((key, index) => (
                <div key={key} className="vat__column">
                  <button type="button" className="btn-ghost" onClick={() => settle(() => dispatch({ type: 'sort', key }))}>
                    {columnLabel(key)}
                  </button>
                  <input
                    type="checkbox"
                    aria-label={columnLabel(key)}
                    checked={!hiddenSet.has(key)}
                    onChange={() => toggleColumn(key)}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    aria-label={`Wyżej ${columnLabel(key)}`}
                    disabled={index === 0}
                    onClick={() => moveColumn(key, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    aria-label={`Niżej ${columnLabel(key)}`}
                    disabled={index === order.length - 1}
                    onClick={() => moveColumn(key, 1)}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {filtersOpen ? (
          <div className="vat__panel" role="dialog" aria-label="Filtry">
            <div className="vat__fields">
              <label>
                Rok
                <select
                  value={draft.year}
                  onChange={(event) => setDraft((current) => ({ ...current, year: event.target.value }))}
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Miesiąc
                <select
                  value={draft.month}
                  onChange={(event) => setDraft((current) => ({ ...current, month: event.target.value }))}
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Rodzaj operacji
                <select
                  value={draft.operation}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, operation: event.target.value }))
                  }
                >
                  <option value="all">Wszystkie</option>
                  {operations.map((operation) => (
                    <option key={operation} value={operation}>
                      {operation}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kod JPK V7
                <select
                  value={draft.jpkCode}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, jpkCode: event.target.value }))
                  }
                >
                  <option value="all">Wszystkie</option>
                  <option value="K_19">K_19</option>
                  <option value="K_10">K_10</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="btn-line vat__series"
              aria-pressed={state.seriesOpen}
              onClick={() => dispatch({ type: 'toggleSeries' })}
            >
              <Icon name="tag" />
              Serie dokumentów
            </button>
            <div className="vat__panel-actions">
              <button type="button" className="btn-line" onClick={clearFilters}>
                Wyczyść filtry
              </button>
              <button
                type="button"
                className={fillApply ? 'btn-fill' : 'btn-line'}
                onClick={applyFilters}
              >
                Zastosuj
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="vat__backdrop" onClick={() => setFiltersOpen(false)} />
      ) : null}

      {chips.length > 0 ? (
        <div className="vat__chips">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="vat__chip"
              aria-label={`Usuń ${chip.label}`}
              onClick={() => removeChip(chip.id)}
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {showChipClear ? (
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              Wyczyść filtry
            </button>
          ) : null}
        </div>
      ) : null}

      {state.seriesOpen ? (
        <p className="vat__series-note">
          Aktywna seria demonstracyjna: DEMO. Serie nie tworzą zapisów w ewidencji organizacji.
        </p>
      ) : null}

      <div className="vat__summary">
        <div className="vat__totals">
          <div>
            <span>Netto</span>
            <strong>{formatMoney(summary.net)}</strong>
          </div>
          <div>
            <span>VAT</span>
            <strong>{formatMoney(summary.vat)}</strong>
          </div>
          <div className="is-gross">
            <span>Brutto</span>
            <strong>{formatMoney(summary.gross)}</strong>
          </div>
        </div>
        <h3 className="vat__rates-title">Kwoty według stawek VAT</h3>
        <div className="vat__rates">
          <span className="badge badge-demo">VAT · DEMO</span>
          {RATES.map((rate) => {
            const amount = summary.byRate.get(rate) ?? 0
            return (
              <div key={rate} className="vat__rate">
                <span>{rate}</span>
                <span className="vat__bar" aria-hidden="true">
                  <span style={{ width: `${(amount / rateMax) * 100}%` }} />
                </span>
                <span>{formatMoney(amount)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={phone ? 'vat__list is-cards' : 'vat__list'} aria-busy={loading}>
        <table className="vat__table">
          <caption className="sr-only">{TAB_LABEL[state.tab]}</caption>
          {listReplaced || loading ? null : (
            <thead>
              <tr>
                {visibleKeys.map((key) => (
                  <th key={key} aria-sort={state.sortKey === key ? state.sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
                    <button type="button" onClick={() => settle(() => dispatch({ type: 'sort', key }))}>
                      {columnLabel(key)}
                    </button>
                  </th>
                ))}
                <th>
                  <span className="sr-only">Szczegóły</span>
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              [0, 1, 2, 3].map((row) => (
                <tr key={row} className="vat__skeleton-row">
                  <td colSpan={visibleKeys.length + 1}>
                    <span className="vat__skeleton" />
                  </td>
                </tr>
              ))
            ) : view === 'error' ? (
              <tr>
                <td colSpan={visibleKeys.length + 1}>
                  <div className="vat__message" role="alert">
                    <Icon name="info" />
                    <p>Nie udało się wczytać zapisów.</p>
                    <button
                      type="button"
                      className={filtersOpen ? 'btn-line' : 'btn-fill'}
                      onClick={() => settle(() => setView('data'))}
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 || view === 'empty' ? (
              <tr>
                <td colSpan={visibleKeys.length + 1}>
                  <div className="vat__message">
                    <Icon name="document" />
                    <p>Brak zapisów dla wybranego okresu.</p>
                    {showEmptyClear ? (
                      <button type="button" className="btn-line" onClick={clearFilters}>
                        Wyczyść filtry
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((entry) => (
                <RegisterRow
                  key={entry.id}
                  entry={entry}
                  columns={visibleKeys}
                  choices={operations}
                  expanded={state.expandedId === entry.id}
                  onToggle={toggleRow}
                  onOperation={changeOperation}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPager ? (
        <div className="vat__footer">
          <p>{range}</p>
          <div className="vat__pager">
            <button
              type="button"
              className="btn-line"
              aria-label="Poprzednia strona"
              disabled={page <= 1}
              onClick={() => settle(() => dispatch({ type: 'page', page: page - 1 }))}
            >
              <Icon name="chevron" />
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              type="button"
              className="btn-line"
              aria-label="Następna strona"
              disabled={page >= pageCount}
              onClick={() => settle(() => dispatch({ type: 'page', page: page + 1 }))}
            >
              <Icon name="chevron" />
            </button>
          </div>
          <div className="vat__page-size">
            <button
              type="button"
              className="btn-line"
              aria-label="Liczba zapisów na stronie"
              aria-haspopup="listbox"
              aria-expanded={pageSizeOpen}
              onClick={() => {
                setPageSizeOpen((open) => !open)
                setMenuOpen(false)
                setFiltersOpen(false)
              }}
            >
              {state.pageSize} na stronie
            </button>
            {pageSizeOpen ? (
              <div className="vat__page-size-menu" role="listbox" aria-label="Liczba zapisów na stronie">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={state.pageSize === size}
                    className={state.pageSize === size ? 'is-selected' : undefined}
                    onClick={() => {
                      setPageSizeOpen(false)
                      settle(() => dispatch({ type: 'pageSize', pageSize: size }))
                    }}
                  >
                    {size} na stronie
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {status.length > 0 ? (
        <p className="sr-only" role="status">
          {status}
        </p>
      ) : null}
    </section>
  )
}

const RegisterRow = memo(function RegisterRow({
  entry,
  columns,
  choices,
  expanded,
  onToggle,
  onOperation,
}: {
  entry: VatEntry
  columns: readonly SortKey[]
  choices: readonly VatEntry['operation'][]
  expanded: boolean
  onToggle: (id: string) => void
  onOperation: (id: string, operation: VatEntry['operation']) => void
}) {
  return (
    <>
      <tr className={entry.operation === 'Korekta' ? 'is-correction' : undefined}>
        {columns.map((key) => (
          <td key={key} data-label={columnLabel(key)} className={`vat__cell vat__cell-${key}`}>
            {entry[key]}
          </td>
        ))}
        <td className="vat__cell vat__cell-expand" data-label="">
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={expanded}
            aria-label={`Szczegóły ${entry.contractor}`}
            onClick={() => onToggle(entry.id)}
          >
            <Icon name="expand" />
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="vat__detail-row">
          <td colSpan={columns.length + 1}>
            <dl className="vat__detail">
              <div>
                <dt>Kontrahent</dt>
                <dd>{entry.contractor}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{entry.date}</dd>
              </div>
              <div>
                <dt>Numer dokumentu</dt>
                <dd>{entry.documentNumber}</dd>
              </div>
              <div>
                <dt>Numer KSeF</dt>
                <dd>{entry.ksefStatus}</dd>
              </div>
              <div>
                <dt>Identyfikator</dt>
                <dd>{entry.identifier}</dd>
              </div>
              <div>
                <dt>Rodzaj operacji</dt>
                <dd>
                  <div className="vat__ops" role="radiogroup" aria-label="Rodzaj operacji">
                    {choices.map((operation) => (
                      <button
                        key={operation}
                        type="button"
                        role="radio"
                        className={
                          entry.operation === operation ? 'vat__op-choice is-selected' : 'vat__op-choice'
                        }
                        aria-checked={entry.operation === operation}
                        onClick={() => onOperation(entry.id, operation)}
                      >
                        {operation}
                      </button>
                    ))}
                  </div>
                </dd>
              </div>
              <div>
                <dt>Kod JPK V7</dt>
                <dd>{entry.jpkCode}</dd>
              </div>
            </dl>
            <p>
              Stawka {entry.rate}. Netto {formatMoney(entry.net)}. VAT {formatMoney(entry.vat)}. Brutto{' '}
              {formatMoney(entry.gross)}.
            </p>
          </td>
        </tr>
      ) : null}
    </>
  )
})
