import type { RegisterKind, RegisterState, SortKey, VatEntry, VatRate } from './types.ts'

export const REGISTER_OPERATIONS: Record<RegisterKind, readonly VatEntry['operation'][]> = {
  sale: ['Faktura', 'Korekta'],
  purchase: ['Zakup', 'Korekta'],
}

export const initialRegisterState: RegisterState = {
  tab: 'sale',
  search: '',
  year: '2026',
  month: '10',
  operation: 'all',
  jpkCode: 'all',
  sortKey: 'date',
  sortDirection: 'asc',
  page: 1,
  pageSize: 10,
  expandedId: null,
  seriesOpen: false,
}

export type RegisterAction =
  | { type: 'search'; value: string }
  | { type: 'tab'; value: RegisterState['tab'] }
  | { type: 'year' | 'month' | 'operation' | 'jpkCode'; value: string }
  | { type: 'sort'; key: SortKey }
  | { type: 'page'; page: number }
  | { type: 'pageSize'; pageSize: number }
  | { type: 'filters'; year: string; month: string; operation: string; jpkCode: string }
  | { type: 'toggleRow'; id: string }
  | { type: 'toggleSeries' }
  | { type: 'resetFilters' }
  | { type: 'reset' }

function narrow(state: RegisterState, patch: Partial<RegisterState>): RegisterState {
  return { ...state, ...patch, page: 1, expandedId: null }
}

export function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'search':
      return narrow(state, { search: action.value })
    case 'tab': {
      const allowed = REGISTER_OPERATIONS[action.value]
      const operation =
        state.operation === 'all' || allowed.includes(state.operation as VatEntry['operation'])
          ? state.operation
          : 'all'
      return narrow(state, { tab: action.value, operation })
    }
    case 'year':
      return narrow(state, { year: action.value })
    case 'month':
      return narrow(state, { month: action.value })
    case 'operation':
      return narrow(state, { operation: action.value })
    case 'jpkCode':
      return narrow(state, { jpkCode: action.value })
    case 'sort': {
      const sameColumn = state.sortKey === action.key
      const sortDirection =
        sameColumn && state.sortDirection === 'asc' ? 'desc' : 'asc'
      return narrow(state, { sortKey: action.key, sortDirection })
    }
    case 'page':
      return { ...state, page: action.page, expandedId: null }
    case 'pageSize':
      return narrow(state, { pageSize: action.pageSize })
    case 'filters':
      return narrow(state, {
        year: action.year,
        month: action.month,
        operation: action.operation,
        jpkCode: action.jpkCode,
      })
    case 'toggleRow':
      return {
        ...state,
        expandedId: state.expandedId === action.id ? null : action.id,
      }
    case 'toggleSeries':
      return { ...state, seriesOpen: !state.seriesOpen }
    case 'resetFilters':
      return narrow(state, {
        search: '',
        year: initialRegisterState.year,
        month: initialRegisterState.month,
        operation: initialRegisterState.operation,
        jpkCode: initialRegisterState.jpkCode,
      })
    case 'reset':
      return initialRegisterState
    default:
      return state
  }
}

export function visibleEntries(entries: readonly VatEntry[], state: RegisterState): VatEntry[] {
  const query = state.search.trim().toLowerCase()
  const filtered = entries.filter((entry) => {
    if (entry.register !== state.tab) return false
    if (String(entry.year) !== state.year) return false
    if (String(entry.month) !== state.month) return false
    if (state.operation !== 'all' && entry.operation !== state.operation) return false
    if (state.jpkCode !== 'all' && entry.jpkCode !== state.jpkCode) return false
    if (query.length === 0) return true
    return (
      entry.contractor.toLowerCase().includes(query) ||
      entry.documentNumber.toLowerCase().includes(query) ||
      entry.identifier.toLowerCase().includes(query) ||
      entry.ksefStatus.toLowerCase().includes(query)
    )
  })

  const direction = state.sortDirection === 'asc' ? 1 : -1
  return filtered.toSorted(
    (left, right) =>
      left[state.sortKey].localeCompare(right[state.sortKey], 'pl') * direction,
  )
}

export type RegisterSummary = {
  net: number
  vat: number
  gross: number
  byRate: ReadonlyMap<VatRate, number>
}

export function summarize(entries: readonly VatEntry[]): RegisterSummary {
  const byRate = new Map<VatRate, number>()
  let net = 0
  let vat = 0
  let gross = 0

  for (const entry of entries) {
    net += entry.net
    vat += entry.vat
    gross += entry.gross
    byRate.set(entry.rate, (byRate.get(entry.rate) ?? 0) + entry.vat)
  }

  return { net, vat, gross, byRate }
}
