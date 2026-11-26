// Slices of the pages pie: the busiest pages, then the rest folded into « Autres ».
// Beyond 7 named slices a pie can't be read: colors stop being distinct.
export const MAX_SLICES = 7

export function pieSlices (pages, maxSlices = MAX_SLICES) {
  const viewed = pages.filter(p => p.views > 0).sort((a, b) => b.views - a.views)
  const total = viewed.reduce((sum, p) => sum + p.views, 0)
  if (!total) return []
  const named = viewed.length > maxSlices ? viewed.slice(0, maxSlices - 1) : viewed
  const rest = viewed.slice(named.length)
  const slices = named.map((p, i) => ({ id: p.id, name: p.name, views: p.views, slot: i + 1 }))
  if (rest.length) slices.push({ id: null, name: `Autres (${rest.length})`, views: rest.reduce((s, p) => s + p.views, 0), slot: 0 })
  let angle = 0
  return slices.map(s => {
    const share = s.views / total
    const slice = { ...s, share, start: angle, end: angle + share * 2 * Math.PI }
    angle = slice.end
    return slice
  })
}

// SVG path of a donut slice between two angles (radians, clockwise from 12 o'clock)
export function arcPath (start, end, outer, inner, center = outer) {
  // A full circle can't be one arc: split it in two
  if (end - start >= 2 * Math.PI - 1e-6) {
    return arcPath(start, start + Math.PI, outer, inner, center) + ' ' + arcPath(start + Math.PI, end, outer, inner, center)
  }
  const point = (r, a) => `${(center + r * Math.sin(a)).toFixed(2)} ${(center - r * Math.cos(a)).toFixed(2)}`
  const large = end - start > Math.PI ? 1 : 0
  return `M ${point(outer, start)} A ${outer} ${outer} 0 ${large} 1 ${point(outer, end)} ` +
    `L ${point(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, start)} Z`
}
