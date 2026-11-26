import { describe, expect, it } from 'vitest'
import { arcPath, pieSlices } from '@/pie'

const page = (id, views) => ({ id, name: id, views, sessions: 0 })

describe('pieSlices', () => {
  it('sorts by views, skips unseen pages and covers the whole circle', () => {
    const slices = pieSlices([page('a', 1), page('b', 3), page('z', 0)])
    expect(slices.map(s => [s.name, s.share, s.slot])).toEqual([['b', 0.75, 1], ['a', 0.25, 2]])
    expect(slices.at(-1).end).toBeCloseTo(2 * Math.PI)
  })

  it('folds the smallest pages into « Autres »', () => {
    const slices = pieSlices([1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => page('p' + n, n)))
    expect(slices).toHaveLength(7)
    expect(slices.at(-1)).toMatchObject({ id: null, name: 'Autres (3)', views: 6, slot: 0 })
  })

  it('is empty without views', () => {
    expect(pieSlices([page('a', 0)])).toEqual([])
  })

  it('draws a full circle as two arcs', () => {
    expect(arcPath(0, 2 * Math.PI, 10, 5).match(/M /g)).toHaveLength(2)
  })
})
