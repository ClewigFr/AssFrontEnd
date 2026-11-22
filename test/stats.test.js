import { describe, it, expect } from 'vitest'
import { bucketSeries, delta, formatDuration, formatPercent, kpis, pageRows, timeZoneOffsetMinutes } from '@/stats'

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
