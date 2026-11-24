<template>
  <div class="stats">
    <div class="toolbar">
      <div
        class="segmented"
        role="group"
        aria-label="Période"
      >
        <button
          v-for="p in periods"
          :key="p.key"
          type="button"
          :aria-pressed="p.key === period"
          :class="{ active: p.key === period }"
          @click="setPeriod(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="navigation">
        <button
          type="button"
          class="secondary small"
          title="Période précédente"
          @click="move(-1)"
        >
          ◀
        </button>
        <span class="range">{{ rangeLabel }}</span>
        <button
          type="button"
          class="secondary small"
          title="Période suivante"
          :disabled="offset >= 0"
          @click="move(1)"
        >
          ▶
        </button>
      </div>
    </div>

    <p
      v-if="error"
      class="banner danger"
    >
      {{ error }}
    </p>

    <div
      v-if="stats"
      class="kpis"
    >
      <div
        v-for="k in cards"
        :key="k.key"
        class="kpi card"
      >
        <div class="kpi-label">
          {{ k.label }}
        </div>
        <div class="kpi-value">
          {{ k.value }}
        </div>
        <div
          v-if="k.delta"
          class="kpi-delta"
          :class="[k.delta.trend, k.delta.trend === k.better ? 'good' : (k.delta.trend === 'flat' ? '' : 'bad')]"
          :title="'Par rapport à ' + k.previousLabel"
        >
          {{ k.delta.trend === 'up' ? '▲' : k.delta.trend === 'down' ? '▼' : '' }} {{ k.delta.label }}
        </div>
        <div
          v-else
          class="kpi-delta"
        >
          &nbsp;
        </div>
      </div>
    </div>

    <p
      v-if="note"
      class="hint retention"
    >
      {{ note }}
    </p>

    <section class="card">
      <h2>Activité</h2>
      <div
        ref="chart"
        class="chart"
      />
    </section>

    <section class="card">
      <div class="section-head">
        <h2>Pages</h2>
        <input
          v-model="filter"
          type="search"
          class="filter"
          aria-label="Filtrer les pages"
          placeholder="Filtrer"
        >
      </div>
      <div
        v-if="rows.length"
        class="table-wrap"
      >
        <table class="pages-table">
          <thead>
            <tr>
              <th>Page</th>
              <th class="num">
                Vues
              </th>
              <th class="num">
                Sessions
              </th>
              <th>Part du trafic</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
            >
              <td>{{ row.name }}</td>
              <td class="num">
                {{ formatNumber(row.views) }}
              </td>
              <td class="num">
                {{ noSessions ? '—' : formatNumber(row.sessions) }}
              </td>
              <td>
                <div class="share">
                  <div
                    class="share-bar"
                    :style="{ width: (row.share * 100) + '%' }"
                  />
                  <span>{{ formatPercent(row.share) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-else-if="stats"
        class="hint"
      >
        Aucune page ne correspond.
      </p>
    </section>
  </div>
</template>

<script>
import ApexCharts from 'apexcharts'
import { api } from '@/api'
import {
  PERIODS, bucketSeries, detailCoverage, detailNote, formatNumber, formatPercent, formatRange, kpis, pageRows, timeZoneOffsetMinutes
} from '@/stats'

export default {
  name: 'StatsPage',
  props: {
    appId: { type: String, required: true }
  },
  emits: ['authenticated'],
  data () {
    // In the URL (?period=month&offset=-2) so a reload or a shared link shows the same period
    const query = this.$route.query
    const period = PERIODS.some(p => p.key === query.period) ? query.period : 'week'
    const offset = Number.parseInt(query.offset, 10)
    return { periods: PERIODS, period, offset: offset < 0 ? offset : 0, stats: null, filter: '', error: '' }
  },
  computed: {
    cards () {
      return this.stats ? kpis(this.stats) : []
    },
    rows () {
      return this.stats ? pageRows(this.stats.pages, this.filter, this.stats.current.views) : []
    },
    note () {
      return this.stats ? detailNote(this.stats) : null
    },
    noSessions () {
      return this.stats ? detailCoverage(this.stats) === 'none' : false
    },
    rangeLabel () {
      return this.stats ? formatRange(this.stats.from, this.stats.to, this.stats.period) : ''
    }
  },
  mounted () {
    this.load()
    // Redraw with the other palette when the system switches between light and dark
    this.colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)')
    this.onSchemeChange = () => { if (this.stats) this.drawChart() }
    this.colorScheme?.addEventListener?.('change', this.onSchemeChange)
  },
  beforeUnmount () {
    this.colorScheme?.removeEventListener?.('change', this.onSchemeChange)
    if (this.chart) this.chart.destroy()
  },
  methods: {
    formatNumber,
    formatPercent,
    setPeriod (period) {
      this.period = period
      this.offset = 0
      this.saveInUrl()
      this.load()
    },
    move (step) {
      this.offset = Math.min(0, this.offset + step)
      this.saveInUrl()
      this.load()
    },
    saveInUrl () {
      const query = { ...this.$route.query, period: this.period, offset: String(this.offset) }
      if (this.period === 'week') delete query.period
      if (this.offset === 0) delete query.offset
      this.$router.replace({ query })
    },
    // Called on mount and on period changes
    load () {
      const query = `period=${this.period}&offset=${this.offset}&tz=${timeZoneOffsetMinutes()}`
      const requested = query
      return api.get(`apps/${this.appId}/stats?${query}`)
        .then(json => {
          if (requested !== `period=${this.period}&offset=${this.offset}&tz=${timeZoneOffsetMinutes()}`) return // a newer request is on its way
          this.error = ''
          this.stats = json
          this.drawChart()
        })
        .catch(error => {
          if (error.status === 401) this.$emit('authenticated', false)
          else {
            // Don't leave the previous period's figures under the new period's buttons
            this.stats = null
            this.error = 'Impossible de charger les statistiques.'
          }
        })
    },
    drawChart () {
      const series = bucketSeries(this.stats)
      // Colours from the design tokens, so the chart follows the light or dark theme
      const css = getComputedStyle(this.$refs.chart)
      const color = name => css.getPropertyValue(name).trim()
      const options = {
        chart: {
          type: 'area',
          height: 300,
          toolbar: { show: false },
          animations: { enabled: false },
          background: 'transparent',
          foreColor: color('--muted'),
          fontFamily: 'inherit'
        },
        theme: { mode: this.colorScheme?.matches ? 'dark' : 'light' },
        colors: [color('--primary'), color('--accent')],
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
        grid: { borderColor: color('--border'), strokeDashArray: 3 },
        tooltip: { theme: this.colorScheme?.matches ? 'dark' : 'light' },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        series: [
          { name: 'Pages vues', data: series.views },
          { name: 'Sessions', data: series.sessions }
        ],
        xaxis: { categories: series.categories, tickAmount: Math.min(series.categories.length, 12) },
        yaxis: { min: 0, forceNiceScale: true, labels: { formatter: v => formatNumber(v) } },
        legend: { position: 'top' }
      }
      if (this.chart) {
        this.chart.updateOptions(options)
      } else {
        this.chart = new ApexCharts(this.$refs.chart, options)
        this.chart.render()
      }
    }
  }
}
</script>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.navigation { display: flex; align-items: center; gap: 8px; }
.range { min-width: 170px; text-align: center; font-weight: 600; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi { margin: 0; padding: 14px 16px; }
.kpi-label { color: var(--muted); font-size: 0.85rem; }
.kpi-value { font-size: 1.6rem; font-weight: 700; margin: 2px 0; font-variant-numeric: tabular-nums; }
.kpi-delta { font-size: 0.82rem; color: var(--muted); }
.kpi-delta.good { color: var(--success); }
.kpi-delta.bad { color: var(--danger); }
.retention { margin: -4px 0 16px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.section-head h2 { margin: 0; }
.filter { max-width: 220px; }
.pages-table td:first-child { font-weight: 600; }
.share { position: relative; background: var(--surface-2); border-radius: 4px; height: 22px; min-width: 120px; }
.share-bar { position: absolute; inset: 0 auto 0 0; background: var(--primary); opacity: 0.28; border-radius: 4px; }
.share span { position: relative; padding-left: 8px; font-size: 0.82rem; line-height: 22px; font-variant-numeric: tabular-nums; }
@media (max-width: 600px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .navigation { justify-content: space-between; }
  .kpis { grid-template-columns: repeat(2, 1fr); }
  .kpi-value { font-size: 1.3rem; }
}
</style>
