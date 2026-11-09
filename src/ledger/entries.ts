import type { VatEntry } from './types.ts'

const saleNet = [700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 600]
const saleVat = [161, 161, 161, 161, 161, 161, 161, 161, 161, 161, 161, 161, 161, 230]

const sales: VatEntry[] = saleNet.map((net, index) => {
  const number = index + 1
  const vat = saleVat[index] ?? 0
  const correction = number === 3
  return {
    id: `sale-${number}`,
    register: 'sale',
    contractor: `Demo Alfa ${String(number).padStart(2, '0')}`,
    date: `2026-10-${String(number).padStart(2, '0')}`,
    documentNumber: `${correction ? 'KOR' : 'FV'}/${number}/10/2026/DEMO`,
    ksefStatus: 'Brak potwierdzenia',
    identifier: `DEMO-S-${number}`,
    operation: correction ? 'Korekta' : 'Faktura',
    jpkCode: number === 4 ? 'K_10' : 'K_19',
    year: 2026,
    month: 10,
    rate: '23%',
    net,
    vat,
    gross: net + vat,
  }
})

const purchases: VatEntry[] = [1, 2, 3, 4].map((number) => ({
  id: `purchase-${number}`,
  register: 'purchase',
  contractor: `Demo Beta ${String(number).padStart(2, '0')}`,
  date: `2026-10-${String(number).padStart(2, '0')}`,
  documentNumber: `FZ/${number}/10/2026/DEMO`,
  ksefStatus: 'Brak potwierdzenia',
  identifier: `DEMO-Z-${number}`,
  operation: 'Zakup',
  jpkCode: 'K_19',
  year: 2026,
  month: 10,
  rate: '23%',
  net: 480,
  vat: 110,
  gross: 590,
}))

export const ledgerEntries: readonly VatEntry[] = [...sales, ...purchases]
