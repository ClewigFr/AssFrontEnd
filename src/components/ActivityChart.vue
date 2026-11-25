<template>
  <div
    ref="box"
    class="activity-chart"
  >
    <ul class="legend">
      <li
        v-for="s in series"
        :key="s.key"
        :class="s.key"
      >
        <span class="swatch" />{{ s.name }}
      </li>
    </ul>
    <svg
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      :width="width"
      :height="HEIGHT"
      role="img"
      :aria-label="summary"
      @mouseleave="hover = null"
    >
      <g class="grid">
        <g
          v-for="t in ticks"
          :key="t"
        >
          <line
            :x1="LEFT"
            :x2="width - RIGHT"
            :y1="y(t)"
            :y2="y(t)"
          />
          <text
            :x="LEFT - 8"
            :y="y(t) + 4"
            text-anchor="end"
          >{{ formatNumber(t) }}</text>
        </g>
        <text
          v-for="i in labels"
          :key="'x' + i"
          :x="x(i)"
          :y="HEIGHT - 6"
          text-anchor="middle"
        >{{ data.categories[i] }}</text>
      </g>
      <path
        class="area views"
        :d="area(data.views)"
      />
      <path
        class="area sessions"
        :d="area(data.sessions)"
      />
      <path
        v-for="s in series"
        :key="s.key"
        :class="['line', s.key]"
        :d="line(data[s.key])"
      />
      <line
        v-if="hover !== null"
        class="cursor"
        :x1="x(hover)"
        :x2="x(hover)"
        :y1="TOP"
        :y2="baseline"
      />
      <!-- One invisible column per slot: hover target, and its figures for screen readers -->
      <rect
        v-for="(c, i) in data.categories"
        :key="'h' + i"
        class="hit"
        :x="x(i) - step / 2"
        :y="TOP"
        :width="step"
        :height="baseline - TOP"
        @mouseenter="hover = i"
      >
        <title>{{ tooltip(i) }}</title>
      </rect>
    </svg>
    <div
      v-if="hover !== null"
      class="tip"
      :style="{ left: Math.min(Math.max(x(hover), 90), width - 90) + 'px' }"
      aria-hidden="true"
    >
      <strong>{{ data.categories[hover] }}</strong>
      <span
        v-for="s in series"
        :key="s.key"
        :class="s.key"
      >
        <span class="swatch" />{{ s.name }} : {{ data[s.key][hover] == null ? '—' : formatNumber(data[s.key][hover]) }}
      </span>
    </div>
  </div>
</template>

<script>
import { areaPath, labelIndexes, linePath, niceTicks } from '@/chartScale'
import { formatNumber } from '@/stats'

// Replaces ApexCharts (~290 kB gzipped): three series drawn as plain SVG, coloured by the CSS
// design tokens, so it follows the light or dark theme without redrawing.
const HEIGHT = 280
const TOP = 10
const BOTTOM = 26
const LEFT = 48
const RIGHT = 12

export default {
  name: 'ActivityChart',
  props: {
    // { categories, views, sessions, previousViews } from bucketSeries()
    data: { type: Object, required: true }
  },
  data () {
    return {
      width: 640,
      hover: null,
      HEIGHT,
      TOP,
      LEFT,
      RIGHT,
      series: [
        { key: 'views', name: 'Pages vues' },
        { key: 'sessions', name: 'Sessions' },
        { key: 'previousViews', name: 'Vues, période précédente' }
      ]
    }
  },
  computed: {
    baseline () { return HEIGHT - BOTTOM },
    ticks () {
      const all = [...this.data.views, ...this.data.sessions, ...this.data.previousViews].filter(v => v != null)
      return niceTicks(Math.max(0, ...all))
    },
    labels () { return labelIndexes(this.data.categories.length, this.width < 480 ? 6 : 12) },
    step () { return (this.width - LEFT - RIGHT) / Math.max(1, this.data.categories.length - 1) },
    summary () {
      const total = this.data.views.reduce((sum, v) => sum + (v || 0), 0)
      return `Activité : ${formatNumber(total)} pages vues sur ${this.data.categories.length} créneaux`
    }
  },
  mounted () {
    this.resize()
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.resize())
      this.observer.observe(this.$refs.box)
    }
  },
  beforeUnmount () {
    this.observer?.disconnect()
  },
  methods: {
    formatNumber,
    resize () {
      const width = Math.round(this.$refs.box?.clientWidth || 0)
      if (width > 0) this.width = width
    },
    x (i) {
      return this.data.categories.length > 1 ? LEFT + i * this.step : (LEFT + this.width - RIGHT) / 2
    },
    y (value) {
      const top = this.ticks[this.ticks.length - 1]
      return this.baseline - (value / top) * (this.baseline - TOP)
    },
    line (values) { return linePath(values, this.x, this.y) },
    area (values) { return areaPath(values, this.x, this.y, this.baseline) },
    tooltip (i) {
      return [this.data.categories[i], ...this.series.map(s =>
        `${s.name} : ${this.data[s.key][i] == null ? '—' : formatNumber(this.data[s.key][i])}`)].join('\n')
    }
  }
}
</script>

<style scoped>
.activity-chart { position: relative; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 16px; list-style: none; margin: 0 0 6px; padding: 0; font-size: 0.82rem; color: var(--muted); }
.swatch { display: inline-block; width: 12px; height: 3px; border-radius: 2px; margin-right: 6px; vertical-align: middle; background: currentColor; }
.legend .views .swatch, .tip .views .swatch { background: var(--primary); }
.legend .sessions .swatch, .tip .sessions .swatch { background: var(--accent); }
.legend .previousViews .swatch, .tip .previousViews .swatch { background: none; border-top: 2px dashed var(--muted); height: 0; }
.grid line { stroke: var(--border); stroke-dasharray: 3; }
.grid text { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.line.views { stroke: var(--primary); }
.line.sessions { stroke: var(--accent); }
.line.previousViews { stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 5; }
.area { stroke: none; opacity: 0.14; }
.area.views { fill: var(--primary); }
.area.sessions { fill: var(--accent); }
.cursor { stroke: var(--border-strong); }
.hit { fill: transparent; }
.tip {
  position: absolute; top: 34px; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 2px; pointer-events: none; white-space: nowrap;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--shadow); padding: 6px 10px; font-size: 0.8rem;
}
</style>
