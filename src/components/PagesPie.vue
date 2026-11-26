<template>
  <div
    v-if="slices.length"
    class="pie"
  >
    <svg
      class="donut"
      :viewBox="`0 0 ${size} ${size}`"
      role="img"
      :aria-label="'Répartition des vues par page : ' + slices.map(s => `${s.name} ${formatPercent(s.share)}`).join(', ')"
    >
      <path
        v-for="s in slices"
        :key="s.name"
        :d="arcPath(s.start, s.end, outer, inner)"
        :class="['slice', 'slot-' + s.slot, { dim: hovered !== null && hovered !== s.name, link: s.id }]"
        @mouseenter="hovered = s.name"
        @mouseleave="hovered = null"
        @click="s.id && $emit('select', s.id)"
      >
        <title>{{ s.name }} : {{ formatNumber(s.views) }} vues ({{ formatPercent(s.share) }})</title>
      </path>
      <text
        :x="size / 2"
        :y="size / 2 - 4"
        class="center-value"
      >{{ centerValue }}</text>
      <text
        :x="size / 2"
        :y="size / 2 + 16"
        class="center-label"
      >{{ centerLabel }}</text>
    </svg>
    <ul class="legend">
      <li
        v-for="s in slices"
        :key="s.name"
        :class="{ dim: hovered !== null && hovered !== s.name }"
        @mouseenter="hovered = s.name"
        @mouseleave="hovered = null"
      >
        <span :class="['swatch', 'slot-' + s.slot]" />
        <a
          v-if="s.id"
          href="#"
          :title="'Voir le détail de ' + s.name"
          :aria-current="s.id === selected ? 'true' : undefined"
          @click.prevent="$emit('select', s.id)"
        >{{ s.name }}</a>
        <span v-else>{{ s.name }}</span>
        <span class="value">{{ formatPercent(s.share) }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { arcPath, pieSlices } from '@/pie'
import { formatNumber, formatPercent } from '@/stats'

export default {
  name: 'PagesPie',
  props: {
    pages: { type: Array, required: true },
    selected: { type: String, default: null }
  },
  emits: ['select'],
  data () {
    return { size: 180, outer: 88, inner: 56, hovered: null }
  },
  computed: {
    slices () { return pieSlices(this.pages) },
    hoveredSlice () { return this.slices.find(s => s.name === this.hovered) },
    centerValue () {
      return this.hoveredSlice ? formatPercent(this.hoveredSlice.share) : formatNumber(this.slices.reduce((sum, s) => sum + s.views, 0))
    },
    centerLabel () {
      return this.hoveredSlice ? `${formatNumber(this.hoveredSlice.views)} vues` : 'vues'
    }
  },
  methods: { arcPath, formatNumber, formatPercent }
}
</script>

<style scoped>
/* Categorical slots, validated for colorblind separation on both surfaces; « Autres » is gray */
.pie {
  --slot-1: #2a78d6; --slot-2: #eb6834; --slot-3: #1baf7a; --slot-4: #eda100;
  --slot-5: #e87ba4; --slot-6: #008300; --slot-7: #6250d6; --slot-0: #9aa1b0;
  display: flex; flex-wrap: wrap; align-items: center; gap: 16px 32px; margin-bottom: 16px;
}
@media (prefers-color-scheme: dark) {
  .pie {
    --slot-1: #3987e5; --slot-2: #d95926; --slot-3: #199e70; --slot-4: #c98500;
    --slot-5: #d55181; --slot-6: #0ca30c; --slot-7: #9085e9; --slot-0: #5d6579;
  }
}
.donut { width: 180px; height: 180px; flex: none; }
/* 2px surface gap between slices */
.slice { stroke: var(--surface); stroke-width: 2; stroke-linejoin: round; transition: opacity 0.15s; }
.slice.link { cursor: pointer; }
.dim { opacity: 0.35; }
.center-value { text-anchor: middle; font-size: 22px; font-weight: 700; fill: var(--text); font-variant-numeric: tabular-nums; }
.center-label { text-anchor: middle; font-size: 12px; fill: var(--muted); }
.legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; min-width: 200px; flex: 1; max-width: 360px; }
.legend li { display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
.legend a { color: var(--text); }
.legend a:hover, .legend a[aria-current] { color: var(--primary); }
.value { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
.swatch { width: 12px; height: 12px; border-radius: 3px; flex: none; }
.slot-1 { fill: var(--slot-1); background: var(--slot-1); }
.slot-2 { fill: var(--slot-2); background: var(--slot-2); }
.slot-3 { fill: var(--slot-3); background: var(--slot-3); }
.slot-4 { fill: var(--slot-4); background: var(--slot-4); }
.slot-5 { fill: var(--slot-5); background: var(--slot-5); }
.slot-6 { fill: var(--slot-6); background: var(--slot-6); }
.slot-7 { fill: var(--slot-7); background: var(--slot-7); }
.slot-0 { fill: var(--slot-0); background: var(--slot-0); }
@media (max-width: 600px) {
  .pie { justify-content: center; }
  .legend { max-width: none; }
}
</style>
