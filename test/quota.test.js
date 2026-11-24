import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api'
import { isFull, quotaError, usagePercent, usageText, viewsAlert } from '@/quota'

const account = (monthViews, maxMonthlyViews = 100000) => ({
  quotas: { maxApps: 5, maxPagesPerApp: 30, maxMonthlyViews },
  usage: { apps: 1, monthViews, monthStart: 0 }
})

describe('quota', () => {
  it('alerts only once the monthly views reach the limit', () => {
    expect(viewsAlert(account(99999))).toBe('')
    expect(viewsAlert(account(100000))).toContain('Quota dépassé')
    expect(viewsAlert(account(250000))).toMatch(/250\s000 vues/)
    expect(viewsAlert(account(250000, 0))).toBe('')
    expect(viewsAlert(null)).toBe('')
  })

  it('formats usage', () => {
    expect(usageText(3, 5)).toBe('3 / 5')
    expect(usageText(3, 0)).toBe('3')
    expect(usagePercent(15, 30)).toBe(50)
    expect(usagePercent(300, 30)).toBe(100)
    expect(isFull(5, 5)).toBe(true)
    expect(isFull(5, 0)).toBe(false)
  })

  it('explains the backend quota errors', () => {
    expect(quotaError(new ApiError(403, 'quota: at most 5 applications per account'))).toContain('5 applications')
    expect(quotaError(new ApiError(403, 'quota: at most 30 pages per application'))).toContain('30 pages')
    expect(quotaError(new ApiError(403, 'origin not allowed'))).toBe('')
    expect(quotaError(new ApiError(500, 'x'))).toBe('')
  })
})
