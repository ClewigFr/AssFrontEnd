<template>
  <div class="stats">
    <div class="toolbar">
      <div
        class="periods"
        role="tablist"
      >
        <button
          v-for="p in periods"
          :key="p.key"
          type="button"
          role="tab"
          :aria-selected="p.key === period"
          :class="{ active: p.key === period }"
          @click="setPeriod(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="navigation">
        <button
          type="button"
          title="Période précédente"
          @click="move(-1)"
        >
          ◀
        </button>
        <span class="range">{{ rangeLabel }}</span>
        <button
          type="button"
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
      class="error"
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
        class="kpi"
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

    <h2>Activité</h2>
    <div
      ref="chart"
      class="chart"
    />

    <h2>Pages</h2>
    <label class="filter">Filtrer : <input
      v-model="filter"
      type="search"
      placeholder="Nom de page"
    ></label>
    <table
      v-if="rows.length"
      class="pages-table"
    >
      <thead>
        <tr>
          <th>Page</th>
          <th>Vues</th>
          <th>Sessions</th>
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
    <p
      v-else-if="stats"
      class="hint"
    >
      Aucune page ne correspond.
    </p>
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
    return { periods: PERIODS, period: 'week', offset: 0, stats: null, filter: '', error: '' }
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
  },
  beforeUnmount () {
    if (this.chart) this.chart.destroy()
  },
  methods: {
    formatNumber,
    formatPercent,
    setPeriod (period) {
      this.period = period
      this.offset = 0
      this.load()
    },
    move (step) {
      this.offset = Math.min(0, this.offset + step)
      this.load()
    },
    // Called on mount, on period changes, and by the parent after pages change
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
          else this.error = 'Impossible de charger les statistiques.'
        })
    },
    drawChart () {
      const series = bucketSeries(this.stats)
      const options = {
        chart: { type: 'area', height: 300, toolbar: { show: false }, animations: { enabled: false } },
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
.stats { margin-top: 30px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
.periods button { border: 1px solid #ccc; background: #fff; padding: 6px 14px; cursor: pointer; }
.periods button:first-child { border-radius: 6px 0 0 6px; }
.periods button:last-child { border-radius: 0 6px 6px 0; }
.periods button + button { border-left: none; }
.periods button.active { background: #2c3e50; color: #fff; border-color: #2c3e50; }
.navigation { display: flex; align-items: center; gap: 8px; }
.navigation button { border: 1px solid #ccc; background: #fff; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
.navigation button:disabled { opacity: 0.4; cursor: default; }
.range { min-width: 180px; font-weight: 600; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 20px 0; }
.kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: left; }
.kpi-label { color: #6b7280; font-size: 0.85em; }
.kpi-value { font-size: 1.5em; font-weight: 700; margin: 4px 0; }
.kpi-delta { font-size: 0.85em; color: #6b7280; }
.kpi-delta.good { color: #15803d; }
.kpi-delta.bad { color: #b91c1c; }
.chart { max-width: 760px; margin: 0 auto; }
.filter { display: block; margin-bottom: 8px; }
.pages-table { width: 100%; border-collapse: collapse; text-align: left; }
.pages-table th, .pages-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
.pages-table th { color: #6b7280; font-weight: 600; font-size: 0.85em; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.share { position: relative; background: #f3f4f6; border-radius: 4px; height: 20px; min-width: 120px; }
.share-bar { position: absolute; inset: 0 auto 0 0; background: #93c5fd; border-radius: 4px; }
.share span { position: relative; padding-left: 6px; font-size: 0.85em; line-height: 20px; }
.error { color: #b91c1c; }
.hint { color: #6b7280; }
.retention { font-size: 0.9em; max-width: 640px; margin: 8px auto; }
</style>
