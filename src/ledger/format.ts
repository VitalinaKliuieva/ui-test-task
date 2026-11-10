export function formatMoney(value: number): string {
  const negative = value < 0
  const [whole, fraction] = Math.abs(value).toFixed(2).split('.')
  const grouped =
    whole.length > 4 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : whole
  return `${negative ? '-' : ''}${grouped},${fraction} zł`
}

export const MONTHS = [
  { value: '1', label: 'styczeń' },
  { value: '2', label: 'luty' },
  { value: '3', label: 'marzec' },
  { value: '4', label: 'kwiecień' },
  { value: '5', label: 'maj' },
  { value: '6', label: 'czerwiec' },
  { value: '7', label: 'lipiec' },
  { value: '8', label: 'sierpień' },
  { value: '9', label: 'wrzesień' },
  { value: '10', label: 'październik' },
  { value: '11', label: 'listopad' },
  { value: '12', label: 'grudzień' },
] as const

export const YEARS = ['2025', '2026', '2027'] as const

export const PAGE_SIZES = [10, 25, 50] as const
