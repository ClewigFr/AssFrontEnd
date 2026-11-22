<template>
  <div class="stats">
    <!-- <h2>Stats: {{ msg.title }}</h2> -->
    <!-- <label>{{ msg.content }}</label> -->

    <h2>Sessions</h2>
    <label>Total évenements : {{ events }}</label>
    <br>
    <label>Sessions uniques : {{ sessions }}</label>
    <br>
    <label>Pages vues / session : {{ averagePages.toFixed(1) }}</label>
    <div id="chartSessions" />

    <h2>Pages</h2>
    <label>Filtrer page : <input
      v-model="pageFilter"
      type="text"
    ></label>
    <!-- <label>PageFilter : {{ pageFilter }}</label> -->
    <div id="chartPagesHits" />
  </div>
</template>

<script>
import ApexCharts from 'apexcharts'
import { api } from '@/api'
import { averagePagesPerSession, daySeries, pageSlices, timeZoneOffsetMinutes } from '@/stats'

export default {
  name: 'StatsPage',
  emits: ['authenticated'],
  data () {
    return {
      msg: {
        title: 'Stats',
        content: 'Chargement...'
      },
      events: 0,
      sessions: 0,
      pages: [],
      days: [],
      filter: ''
    }
  },
  computed: {
    averagePages () {
      return averagePagesPerSession(this.events, this.sessions)
    },
    pageFilter: {
      get () {
        return this.filter
      },
      set (newVal) {
        this.filter = newVal
        this.drawChartPagesHits()
      }
    }
  },
  mounted () {
    this.msg.title = 'Chargement...'

    // The backend aggregates per day in our time zone
    api.get(`stats/json?tz=${timeZoneOffsetMinutes()}`)
      .then(json => {
        this.msg.title = 'Loaded'
        this.msg.content = 'ok'
        this.events = json.events || 0
        this.sessions = json.sessions || 0
        this.pages = json.pages || []
        this.days = json.days || []
        this.drawChartPagesHits()
        this.drawChartSession()
      })
      .catch(error => {
        if (error.status === 401) {
          // Session expired or missing: go back to the login page
          this.$emit('authenticated', false)
        } else {
          this.msg.content = 'Erreur'
        }
      })
  },
  beforeUnmount () {
    if (this.sessionsChart) this.sessionsChart.destroy()
    if (this.pagesChart) this.pagesChart.destroy()
  },
  methods: {
    drawChartSession () {
      const series = daySeries(this.days)

      // draw
      const options = {
        chart: {
          type: 'area'
        },
        series: [{
          name: 'Sessions (unique)',
          data: series.sessions
        },
        {
          name: 'Sessions (total)',
          data: series.events
        }],
        xaxis: {
          categories: series.categories
        }
      }
      if (this.sessionsChart) {
        this.sessionsChart.updateOptions(options)
      } else {
        this.sessionsChart = new ApexCharts(document.querySelector('#chartSessions'), options)
        this.sessionsChart.render()
      }
    },
    drawChartPagesHits () {
      const { labels, counts: uniquePageCounts } = pageSlices(this.pages, this.filter)

      // draw (reuse the same chart so typing in the filter does not stack charts)
      if (this.pagesChart) {
        this.pagesChart.updateOptions({ series: uniquePageCounts, labels: labels })
        return
      }
      const options = {
        series: uniquePageCounts,
        chart: {
          type: 'pie'
        },
        labels: labels,
        noData: {
          text: 'Aucune donnée'
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 400
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      }
      this.pagesChart = new ApexCharts(document.querySelector('#chartPagesHits'), options)
      this.pagesChart.render()
    }
  }
}
</script>

<style scoped>
#chartPagesHits {
  max-width: 500px;
  margin: 35px auto;
}
#chartSessions {
  max-width: 600px;
  margin: 35px auto;
}
</style>
