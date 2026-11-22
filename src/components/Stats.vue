<template>
  <div class="stats">
    <!-- <h2>Stats: {{ msg.title }}</h2> -->
    <!-- <label>{{ msg.content }}</label> -->

    <h2>Sessions</h2>
    <label>Total évenements : {{ stats.length }}</label>
    <br/>
    <label>Sessions uniques : {{ uniqueSessions.length }}</label>
    <br/>
    <label>Pages vues / session : {{ averagePages.toFixed(1) }}</label>
    <div id="chartSessions"></div>

    <h2>Pages</h2>
    <label>Filtrer page : <input type="text" v-model="pageFilter" /></label>
    <!-- <label>PageFilter : {{ pageFilter }}</label> -->
    <div id="chartPagesHits"></div>

    <!-- <h2>Json</h2>
    <ul v-for="stat in stats" :key="stat.page">
      <li> {{ stat.page }} / {{ stat.sessionId }} / {{ stat.timestamp }} / {{ stat.pageName }} </li>
    </ul> -->
  </div>
</template>

<script>
import ApexCharts from 'apexcharts'

export default {
  name: 'Stats',
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

    this.$http.get('stats/json')
      .then(response => {
        const json = response.body
        this.msg.title = 'Loaded'
        this.msg.content = 'ok'
        this.stats = json.stats || []
        this.pages = json.pages || []
        this.drawChartPagesHits()
        this.drawChartSession()
      }, response => {
        if (response.status === 401) {
          // Session expired or missing: go back to the login page
          this.$emit('authenticated', false)
        } else {
          this.msg.content = 'Erreur'
        }
      })
  },
  beforeDestroy () {
    if (this.sessionsChart) this.sessionsChart.destroy()
    if (this.pagesChart) this.pagesChart.destroy()
  },
  methods: {
    drawChartSession () {
      // Group events per calendar day (year included) and collect unique sessions
      const days = new Map()
      const sessionCounts = new Map()
      this.stats.forEach(item => {
        sessionCounts.set(item.sessionId, (sessionCounts.get(item.sessionId) || 0) + 1)
        if (item.timestamp > 100000) { // prevent from wrong data
          const date = new Date(item.timestamp)
          const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
          let day = days.get(key)
          if (!day) {
            day = {
              key: key,
              formattedDate: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
              sessions: new Set(),
              total: 0
            }
            days.set(key, day)
          }
          day.total++
          day.sessions.add(item.sessionId)
        }
      })
      const dates = Array.from(days.values()).sort((a, b) => a.key - b.key)

      // compute sessions average (0 when there is no data yet)
      this.uniqueSessions = Array.from(sessionCounts.keys())
      this.averagePages = sessionCounts.size === 0 ? 0 : this.stats.length / sessionCounts.size

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
      // filter data
      let filtredPages = this.pages
      if (this.filter.length > 0) {
        filtredPages = filtredPages.filter(item => item.name.includes(this.filter))
      }
      // compute data: views per page id
      const hitsPerPage = new Map()
      this.stats.forEach(item => hitsPerPage.set(item.page, (hitsPerPage.get(item.page) || 0) + 1))
      const uniquePageCounts = filtredPages.map(page => hitsPerPage.get(page.id) || 0)
      const labels = filtredPages.map(item => item.name)

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
