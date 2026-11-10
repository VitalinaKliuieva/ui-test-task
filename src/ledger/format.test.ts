import { describe, expect, it } from 'vitest'
import { formatMoney } from './format.ts'

describe('formatMoney', () => {
  it('keeps amounts under 10000 ungrouped', () => {
    expect(formatMoney(0)).toBe('0,00 zł')
    expect(formatMoney(9700)).toBe('9700,00 zł')
    expect(formatMoney(9999.5)).toBe('9999,50 zł')
  })

  it('groups thousands from 10000 with a non-breaking space', () => {
    expect(formatMoney(10000)).toBe('10\u00a0000,00 zł')
    expect(formatMoney(12023)).toBe('12\u00a0023,00 zł')
  })

  it('keeps the sign in front of a grouped amount', () => {
    expect(formatMoney(-12023)).toBe('-12\u00a0023,00 zł')
  })
})
