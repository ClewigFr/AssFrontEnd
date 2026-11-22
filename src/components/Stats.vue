<template>
  <div class="stats">
    <!-- <h2>Stats: {{ msg.title }}</h2> -->
    <!-- <label>{{ msg.content }}</label> -->

    <h2>Sessions</h2>
    <label>Total évenements : {{ stats.length }}</label>
    <br>
    <label>Sessions uniques : {{ uniqueSessions.length }}</label>
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

    <!-- <h2>Json</h2>
    <ul v-for="stat in stats" :key="stat.page">
      <li> {{ stat.page }} / {{ stat.sessionId }} / {{ stat.timestamp }} / {{ stat.pageName }} </li>
    </ul> -->
  </div>
</template>

<script>
import ApexCharts from 'apexcharts'
import { api } from '@/api'
import { groupByDay, countBySession, averagePagesPerSession, hitsPerPage } from '@/stats'

export default {
  name: 'StatsPage',
  emits: ['authenticated'],
  data () {
    return {
      msg: {
        title: 'Stats',
        content: 'Chargement...'
      },
      stats: [],
      pages: [],
      uniqueSessions: [],
      averagePages: 0,
      filter: ''
    }
  },
  computed: {
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

    api.get('stats/json')
      .then(json => {
        this.msg.title = 'Loaded'
        this.msg.content = 'ok'
        this.stats = json.stats || []
        this.pages = json.pages || []
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
      const dates = groupByDay(this.stats)
      this.uniqueSessions = Array.from(countBySession(this.stats).keys())
      this.averagePages = averagePagesPerSession(this.stats)

      // draw
      const options = {
        chart: {
          type: 'area'
        },
        series: [{
          name: 'Sessions (unique)',
          data: dates.map(item => item.sessions.size)
        },
        {
          name: 'Sessions (total)',
          data: dates.map(item => item.total)
        }],
        xaxis: {
          categories: dates.map(item => item.formattedDate)
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
      const { labels, counts: uniquePageCounts } = hitsPerPage(this.stats, this.pages, this.filter)

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
