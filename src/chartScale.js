// Geometry for the activity chart (ActivityChart.vue), kept apart so it can be unit tested.

/** Round axis ticks from 0 to at least max: 0, step, 2·step… with step 1, 2 or 5 × 10^n. */
export function niceTicks (max, count = 4) {
  if (!(max > 0)) return [0, 1]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= raw)
  const ticks = []
  for (let v = 0; v < max + step / 2 && ticks.length <= count + 1; v += step) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks.map(v => Number(v.toPrecision(12)))
}

/** Indexes of the x labels to show: at most `max`, evenly spread, always the first. */
export function labelIndexes (length, max = 12) {
  if (length <= max) return [...Array(length).keys()]
  const every = Math.ceil(length / max)
  return [...Array(length).keys()].filter(i => i % every === 0)
}

/**
 * SVG path of a series, with null values breaking the line.
 * x(i) and y(value) map to pixels.
 */
export function linePath (values, x, y) {
  let path = ''
  let drawing = false
  values.forEach((v, i) => {
    if (v == null) { drawing = false; return }
    path += `${drawing ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
    drawing = true
  })
  return path
}

/** The area under a series (no nulls expected), closed on the baseline. */
export function areaPath (values, x, y, baseline) {
  if (!values.length) return ''
  return `${linePath(values.map(v => v ?? 0), x, y)}L${x(values.length - 1).toFixed(1)},${baseline}L${x(0).toFixed(1)},${baseline}Z`
}
