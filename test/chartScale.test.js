import { describe, expect, it } from 'vitest'
import { areaPath, labelIndexes, linePath, niceTicks } from '@/chartScale'

describe('chartScale', () => {
  it('rounds the axis to 1, 2 or 5 × 10^n', () => {
    expect(niceTicks(0)).toEqual([0, 1])
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(1234)).toEqual([0, 500, 1000, 1500])
    expect(niceTicks(0.3)).toEqual([0, 0.1, 0.2, 0.3])
  })

  it('spreads at most max x labels', () => {
    expect(labelIndexes(5)).toEqual([0, 1, 2, 3, 4])
    expect(labelIndexes(24, 12)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22])
  })

  it('breaks the line on missing values and closes areas', () => {
    const x = i => i * 10
    const y = v => 100 - v
    expect(linePath([1, null, 3, 4], x, y)).toBe('M0.0,99.0M20.0,97.0L30.0,96.0')
    expect(areaPath([1, 2], x, y, 100)).toBe('M0.0,99.0L10.0,98.0L10.0,100L0.0,100Z')
  })
})
