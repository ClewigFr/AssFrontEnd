import { describe, it, expect } from 'vitest'
import { groupByDay, countBySession, averagePagesPerSession, hitsPerPage } from '@/stats'

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('groupByDay', () => {
  it('sorts days chronologically, whatever the input order', () => {
    const stats = [
      { sessionId: 'a', timestamp: day(2026, 11, 22) },
      { sessionId: 'a', timestamp: day(2026, 11, 2) },
      { sessionId: 'a', timestamp: day(2026, 1, 15) }
    ]
    expect(groupByDay(stats).map(d => d.formattedDate)).toEqual(['15/1/2026', '2/11/2026', '22/11/2026'])
  })

  it('keeps the same date in different years apart', () => {
    const stats = [
      { sessionId: 'a', timestamp: day(2025, 3, 1) },
      { sessionId: 'a', timestamp: day(2026, 3, 1) }
    ]
    expect(groupByDay(stats)).toHaveLength(2)
  })

  it('counts total events and unique sessions per day', () => {
    const stats = [
      { sessionId: 'a', timestamp: day(2026, 5, 1, 9) },
      { sessionId: 'a', timestamp: day(2026, 5, 1, 10) },
      { sessionId: 'b', timestamp: day(2026, 5, 1, 11) }
    ]
    const [d] = groupByDay(stats)
    expect(d.total).toBe(3)
    expect(d.sessions.size).toBe(2)
  })

  it('ignores corrupt timestamps and handles no data', () => {
    expect(groupByDay([{ sessionId: 'a', timestamp: 5 }])).toEqual([])
    expect(groupByDay([])).toEqual([])
  })
})

describe('sessions', () => {
  const stats = [
    { sessionId: 'a', page: 'p1' },
    { sessionId: 'a', page: 'p2' },
    { sessionId: 'b', page: 'p1' }
  ]

  it('counts events per session', () => {
    expect(Array.from(countBySession(stats))).toEqual([['a', 2], ['b', 1]])
  })

  it('averages pages per session', () => {
    expect(averagePagesPerSession(stats)).toBe(1.5)
  })

  it('returns 0 instead of crashing when there is no data', () => {
    expect(averagePagesPerSession([])).toBe(0)
  })
})

describe('hitsPerPage', () => {
  const pages = [{ id: 'p1', name: 'home' }, { id: 'p2', name: 'settings' }, { id: 'p3', name: 'homework' }]
  const stats = [{ page: 'p1' }, { page: 'p1' }, { page: 'p2' }]

  it('counts views for every page, including pages with none', () => {
    expect(hitsPerPage(stats, pages, '')).toEqual({ labels: ['home', 'settings', 'homework'], counts: [2, 1, 0] })
  })

  it('filters pages by name', () => {
    expect(hitsPerPage(stats, pages, 'home')).toEqual({ labels: ['home', 'homework'], counts: [2, 0] })
  })
})
