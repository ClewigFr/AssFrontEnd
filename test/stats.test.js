import { describe, it, expect } from 'vitest'
import { DAY_MS, averagePagesPerSession, daySeries, formatDay, pageSlices, timeZoneOffsetMinutes } from '@/stats'

const dayOf = (y, m, d) => Date.UTC(y, m - 1, d) / DAY_MS

describe('formatDay', () => {
  it('formats a day number as d/m/yyyy', () => {
    expect(formatDay(dayOf(2026, 11, 22))).toBe('22/11/2026')
    expect(formatDay(dayOf(2026, 1, 5))).toBe('5/1/2026')
  })
})

describe('daySeries', () => {
  it('sorts days chronologically, whatever the input order', () => {
    const days = [
      { day: dayOf(2026, 11, 22), events: 3, sessions: 1 },
      { day: dayOf(2025, 3, 1), events: 1, sessions: 1 },
      { day: dayOf(2026, 3, 1), events: 2, sessions: 2 }
    ]
    expect(daySeries(days)).toEqual({
      categories: ['1/3/2025', '1/3/2026', '22/11/2026'],
      events: [1, 2, 3],
      sessions: [1, 2, 1]
    })
  })

  it('handles no data', () => {
    expect(daySeries([])).toEqual({ categories: [], events: [], sessions: [] })
    expect(daySeries(undefined)).toEqual({ categories: [], events: [], sessions: [] })
  })
})

describe('averagePagesPerSession', () => {
  it('divides events by sessions', () => {
    expect(averagePagesPerSession(3, 2)).toBe(1.5)
  })

  it('returns 0 instead of dividing by zero', () => {
    expect(averagePagesPerSession(0, 0)).toBe(0)
  })
})

describe('pageSlices', () => {
  const pages = [
    { id: 'p1', name: 'home', views: 2 },
    { id: 'p2', name: 'settings', views: 1 },
    { id: 'p3', name: 'homework', views: 0 }
  ]

  it('keeps every page, including pages with no views', () => {
    expect(pageSlices(pages, '')).toEqual({ labels: ['home', 'settings', 'homework'], counts: [2, 1, 0] })
  })

  it('filters pages by name', () => {
    expect(pageSlices(pages, 'home')).toEqual({ labels: ['home', 'homework'], counts: [2, 0] })
  })
})

describe('timeZoneOffsetMinutes', () => {
  it('is minutes east of UTC', () => {
    expect(timeZoneOffsetMinutes({ getTimezoneOffset: () => -60 })).toBe(60)
    expect(timeZoneOffsetMinutes({ getTimezoneOffset: () => 300 })).toBe(-300)
  })
})
