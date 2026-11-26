<template>
  <div class="flows">
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

    <template v-if="flows">
      <p class="hint">
        Enchaînements d'écrans au sein d'une session ({{ formatNumber(flows.sessions) }} sessions).
        Seuls les enchaînements vus dans au moins {{ flows.minSessions }} sessions sont affichés,
        jamais un parcours individuel.
        <template v-if="flows.detailFrom && flows.from < flows.detailFrom">
          Avant le {{ new Date(flows.detailFrom).toLocaleDateString('fr-FR') }}, seuls des totaux par jour sont conservés : pas de parcours.
        </template>
      </p>

      <section class="card">
        <h2>Enchaînements les plus fréquents</h2>
        <p
          v-if="rows.transitions.length === 0"
          class="hint"
        >
          Pas assez de sessions sur cette période.
        </p>
        <div
          v-else
          class="table-wrap"
        >
          <table class="flow-table">
            <thead>
              <tr>
                <th>De</th>
                <th>Vers</th>
                <th>Sessions</th>
                <th>Temps moyen avant</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in rows.transitions"
                :key="t.key"
              >
                <td>{{ t.from }}</td>
                <td>
                  → {{ t.to }}<span
                    v-if="t.loop"
                    class="hint"
                  > (même écran)</span>
                </td>
                <td>
                  <div class="share">
                    <div
                      class="share-bar"
                      :style="{ width: (t.bar * 100) + '%' }"
                    />
                    <span>{{ formatNumber(t.sessions) }}</span>
                  </div>
                </td>
                <td>{{ formatDuration(t.avgMs) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="flows.hiddenSessions > 0"
          class="hint"
        >
          Enchaînements plus rares, non détaillés : {{ formatNumber(flows.hiddenSessions) }} {{ flows.hiddenSessions > 1 ? 'passages' : 'passage' }}.
        </p>
      </section>

      <div class="ends">
        <section
          v-for="side in ends"
          :key="side.title"
          class="card"
        >
          <h2>{{ side.title }}</h2>
          <p
            v-if="side.rows.length === 0"
            class="hint"
          >
            Aucune session.
          </p>
          <table v-else>
            <tbody>
              <tr
                v-for="r in side.rows"
                :key="r.key"
              >
                <td>{{ r.name }}</td>
                <td class="num">
                  {{ formatPercent(r.share) }}
                </td>
                <td class="num hint">
                  {{ formatNumber(r.sessions) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
  </div>
</template>

<script>
import { api } from '@/api'
import { flowRows } from '@/flows'
import { PERIODS, formatDuration, formatNumber, formatPercent, formatRange, timeZoneOffsetMinutes } from '@/stats'

export default {
  name: 'FlowsPage',
  props: {
    appId: { type: String, required: true },
    pages: { type: Array, required: true }
  },
  emits: ['authenticated'],
  data () {
    const query = this.$route.query
    const period = PERIODS.some(p => p.key === query.period) ? query.period : 'week'
    const offset = Number.parseInt(query.offset, 10)
    return { periods: PERIODS, period, offset: offset < 0 ? offset : 0, flows: null, error: '' }
  },
  computed: {
    rows () {
      return this.flows ? flowRows(this.flows, this.pages) : null
    },
    ends () {
      return [{ title: 'Écrans d\'entrée', rows: this.rows.entries }, { title: 'Écrans de sortie', rows: this.rows.exits }]
    },
    rangeLabel () {
      return this.flows ? formatRange(this.flows.from, this.flows.to, this.period) : ''
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    formatDuration,
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
    load () {
      const query = `period=${this.period}&offset=${this.offset}&tz=${timeZoneOffsetMinutes()}`
      this.current = query
      return api.get(`apps/${encodeURIComponent(this.appId)}/flows?${query}`)
        .then(json => {
          if (query !== this.current) return
          this.error = ''
          this.flows = json
        })
        .catch(error => {
          if (error.status === 401) this.$emit('authenticated', false)
          else {
            this.flows = null
            this.error = 'Impossible de charger les parcours.'
          }
        })
    }
  }
}
</script>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.navigation { display: flex; align-items: center; gap: 8px; }
.range { min-width: 170px; text-align: center; font-weight: 600; }
.flow-table td:first-child { font-weight: 600; }
.share { position: relative; background: var(--surface-2); border-radius: 4px; height: 22px; min-width: 120px; }
.share-bar { position: absolute; inset: 0 auto 0 0; background: var(--primary); opacity: 0.28; border-radius: 4px; }
.share span { position: relative; padding-left: 8px; font-size: 0.82rem; line-height: 22px; font-variant-numeric: tabular-nums; }
.ends { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
@media (max-width: 600px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .navigation { justify-content: space-between; }
}
</style>
