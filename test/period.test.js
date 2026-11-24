import { describe, expect, it } from 'vitest'
import { lastHour, periodMs, toLocalInput } from '@/period'

describe('period', () => {
  it('formats a local date for datetime-local inputs', () => {
    expect(toLocalInput(new Date(2026, 10, 4, 9, 5))).toBe('2026-11-04T09:05')
  })

  it('defaults to the last hour, up to the next minute', () => {
    const { from, to } = lastHour(new Date(2026, 10, 24, 13, 30))
    expect(from).toBe('2026-11-24T12:30')
    expect(to).toBe('2026-11-24T13:31')
  })

  it('converts a period to epoch ms, or refuses it', () => {
    expect(periodMs('2026-11-24T12:00', '2026-11-24T13:00')).toEqual({
      from: new Date(2026, 10, 24, 12).getTime(),
      to: new Date(2026, 10, 24, 13).getTime()
    })
    expect(periodMs('2026-11-24T13:00', '2026-11-24T12:00')).toBeNull()
    expect(periodMs('', '2026-11-24T12:00')).toBeNull()
  })
})
