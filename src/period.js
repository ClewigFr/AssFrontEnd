// The "Supprimer des vues" period: <input type="datetime-local"> values, in the viewer's time zone.

const pad = (n) => String(n).padStart(2, '0')

/** "2026-11-24T13:05", the value of a datetime-local input, for a Date in local time. */
export const toLocalInput = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

/** Default period: the last hour, to the next minute so the views just received are included. */
export function lastHour (now = new Date()) {
  const to = new Date(now.getTime() + 60_000)
  return { from: toLocalInput(new Date(now.getTime() - 3_600_000)), to: toLocalInput(to) }
}

/** { from, to } in epoch ms, or null when a value is missing or the period is empty. */
export function periodMs (from, to) {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && start < end ? { from: start, to: end } : null
}
