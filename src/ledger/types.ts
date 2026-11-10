export type RegisterKind = 'sale' | 'purchase'

export type VatRate = '23%' | 'np'

export type VatEntry = {
  id: string
  register: RegisterKind
  contractor: string
  date: string
  documentNumber: string
  ksefStatus: string
  identifier: string
  operation: 'Faktura' | 'Korekta' | 'Zakup'
  jpkCode: 'K_19' | 'K_10'
  year: number
  month: number
  rate: VatRate
  net: number
  vat: number
  gross: number
}

export type AreaId = 'vat' | 'posting' | 'assets' | 'controls'

export type SortKey = 'contractor' | 'date' | 'documentNumber' | 'ksefStatus' | 'identifier'

export type SortDirection = 'asc' | 'desc'

export type RegisterState = {
  tab: RegisterKind
  search: string
  year: string
  month: string
  operation: string
  jpkCode: string
  sortKey: SortKey
  sortDirection: SortDirection
  page: number
  pageSize: number
  expandedId: string | null
  seriesOpen: boolean
}
