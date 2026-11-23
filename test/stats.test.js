import { describe, it, expect } from 'vitest'
import { bucketSeries, delta, formatDuration, formatPercent, detailCoverage, detailNote, kpis, pageRows, timeZoneOffsetMinutes } from '@/stats'

const summary = (o = {}) => ({ views: 0, sessions: 0, pagesPerSession: 0, avgSessionMs: 0, bounceRate: 0, ...o })

describe('delta', () => {
  it('gives the percent change and its direction', () => {
    expect(delta(112, 100)).toEqual({ label: '+12 %', trend: 'up' })
    expect(delta(50, 100)).toEqual({ label: '-50 %', trend: 'down' })
    expect(delta(100, 100)).toEqual({ label: '=', trend: 'flat' })
  })

  it('handles a previous period without data', () => {
    expect(delta(5, 0)).toEqual({ label: 'nouveau', trend: 'up' })
    expect(delta(0, 0)).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(0)).toBe('0 s')
    expect(formatDuration(42_000)).toBe('42 s')
    expect(formatDuration(200_000)).toBe('3 min 20 s')
    expect(formatDuration(180_000)).toBe('3 min')
    expect(formatDuration(3_900_000)).toBe('1 h 05 min')
  })
})

describe('formatPercent', () => {
  it('rounds ratios to whole percents', () => {
    expect(formatPercent(0.5)).toBe('50 %')
    expect(formatPercent(0.333)).toBe('33 %')
    expect(formatPercent(undefined)).toBe('0 %')
  })
})

describe('kpis', () => {
  const stats = {
    period: 'week',
    current: summary({ views: 120, sessions: 40, pagesPerSession: 3, avgSessionMs: 90_000, bounceRate: 0.25 }),
    previous: summary({ views: 100, sessions: 40, pagesPerSession: 2.5, avgSessionMs: 60_000, bounceRate: 0.5 })
  }

  it('lists the five indicators with their trend', () => {
    const cards = kpis(stats)
    expect(cards.map(k => k.key)).toEqual(['views', 'sessions', 'pps', 'duration', 'bounce'])
    expect(cards[0].delta).toEqual({ label: '+20 %', trend: 'up' })
    expect(cards[1].delta.trend).toBe('flat')
    expect(cards[3].value).toBe('1 min 30 s')
    expect(cards[0].previousLabel).toBe('les 7 jours précédents')
  })

  it('treats a lower bounce rate as good news', () => {
    const bounce = kpis(stats).find(k => k.key === 'bounce')
    expect(bounce.delta.trend).toBe('down')
    expect(bounce.better).toBe('down')
  })
})

describe('bucketSeries', () => {
  it('maps buckets to chart series', () => {
    const start = new Date(2026, 10, 22, 14).getTime()
    const series = bucketSeries({
      granularity: 'hour',
      buckets: [{ start, views: 3, sessions: 1 }, { start: start + 3_600_000, views: 0, sessions: 0 }]
    })
    expect(series).toEqual({ categories: ['14h', '15h'], views: [3, 0], sessions: [1, 0] })
  })
})

describe('pageRows', () => {
  const pages = [
    { id: '1', name: 'Home', views: 30, sessions: 10 },
    { id: '2', name: 'Cart', views: 10, sessions: 5 },
    { id: '3', name: 'Homework', views: 0, sessions: 0 }
  ]

  it('adds each page\'s share of the views', () => {
    expect(pageRows(pages, '', 40).map(r => r.share)).toEqual([0.75, 0.25, 0])
  })

  it('filters case-insensitively', () => {
    expect(pageRows(pages, 'home', 40).map(r => r.name)).toEqual(['Home', 'Homework'])
  })

  it('handles a period without views', () => {
    expect(pageRows(pages, '', 0).every(r => r.share === 0)).toBe(true)
  })
})

describe('timeZoneOffsetMinutes', () => {
  it('is minutes east of UTC', () => {
    expect(timeZoneOffsetMinutes({ getTimezoneOffset: () => -60 })).toBe(60)
    expect(timeZoneOffsetMinutes({ getTimezoneOffset: () => 300 })).toBe(-300)
  })
})

describe('retention (detailFrom)', () => {
  const DAY = 24 * 60 * 60 * 1000
  const now = Date.UTC(2026, 10, 23)
  const base = {
    period: 'month',
    from: now - 30 * DAY,
    to: now,
    detailFrom: now - 90 * DAY,
    current: { views: 10, sessions: 4, pagesPerSession: 2.5, avgSessionMs: 1000, bounceRate: 0.25 },
    previous: { views: 5, sessions: 2, pagesPerSession: 2.5, avgSessionMs: 1000, bounceRate: 0.5 }
  }

  it('says how much of the period has session details', () => {
    expect(detailCoverage(base)).toBe('full')
    expect(detailCoverage({ ...base, detailFrom: null })).toBe('full')
    expect(detailCoverage({ ...base, from: now - 100 * DAY, to: now - 70 * DAY })).toBe('partial')
    expect(detailCoverage({ ...base, from: now - 130 * DAY, to: now - 100 * DAY })).toBe('none')
  })

  it('explains what is missing, only when something is', () => {
    expect(detailNote(base, now)).toBeNull()
    expect(detailNote({ ...base, from: now - 130 * DAY, to: now - 100 * DAY }, now)).toContain('Au-delà de 90 jours')
    expect(detailNote({ ...base, from: now - 100 * DAY, to: now - 70 * DAY }, now)).toContain('depuis le')
  })

  it('hides session figures and comparisons that the data no longer supports', () => {
    const byKey = list => Object.fromEntries(list.map(k => [k.key, k]))
    const full = byKey(kpis(base))
    expect(full.sessions.delta).not.toBeNull()

    const none = byKey(kpis({ ...base, from: now - 130 * DAY, to: now - 100 * DAY }))
    expect(none.sessions.value).toBe('—')
    expect(none.bounce.delta).toBeNull()
    expect(none.views.value).toBe('10')
    expect(none.views.delta).not.toBeNull()

    // Current period fully detailed, previous one not: no session comparison
    const edge = byKey(kpis({ ...base, from: now - 80 * DAY, to: now - 50 * DAY }))
    expect(edge.sessions.value).toBe('4')
    expect(edge.sessions.delta).toBeNull()
  })
})
