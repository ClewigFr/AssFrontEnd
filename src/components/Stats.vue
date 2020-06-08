<template>
  <div class="stats">
    <h2>Stats: {{ msg.title }}</h2>
    <label>{{ msg.content }}</label>
    <h2>Pages</h2>
    <label>Filtrer page : <input type="text" v-model="pageFilter" /></label>
    <!-- <label>PageFilter : {{ pageFilter }}</label> -->
    <div id="chartPagesHits"></div>
    <h2>Sessions</h2>
    <label>Total : {{ uniqueSessions.length }}</label>
    <br/>
    <label>Pages / session : {{ averagePages }}</label>
    <!-- <h2>Json</h2>
    <ul v-for="stat in stats2" :key="stat.page">
      <li> {{ stat.page }} / {{ stat.sessionId }} / {{ stat.timestamp }} / {{ stat.pageName }} </li>
    </ul> -->
  </div>
</template>

<script>
import Vue from 'vue'
import VueResource from 'vue-resource'
import ApexCharts from 'apexcharts'

Vue.use(VueResource)

export default {
  name: 'Stats',
  data () {
    return {
      msg: {
        title: 'Stats initial title',
        content: 'Content loading...'
      },
      stats: [{
        page: 'demo',
        sessionId: 'azerty',
        timestamp: 0,
        pageName: 'pouet'
      }],
      stats2: [],
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
  http: {
    root: 'https://gentle-inlet-02091.herokuapp.com'
  },
  mounted () {
    this.msg.title = 'Loading...'

    this.$resource('stats/json')
      .get()
      .then(response => response.json())
      .then(json => {
        this.msg.title = 'Loaded'
        this.msg.content = 'ok'
        this.stats2 = json.stats
        this.drawChartPagesHits()
        this.drawChartSession()
      }, response => {
        this.msg.content = 'erreur'
      })
  },
  methods: {
    drawChartSession () {
      this.uniqueSessions = []
      this.stats2.forEach(item => {
        if (!this.uniqueSessions.some(rec => {
          return item.sessionId === rec
        })) {
          this.uniqueSessions.push(item.sessionId)
        }
      })
      var uniqueSessionsCounts = []
      this.uniqueSessions.forEach(session => {
        var sameSessions = this.stats2.filter(item => item.sessionId === session)
        uniqueSessionsCounts.push(sameSessions.length)
      })
      var sum = uniqueSessionsCounts.reduce((a, b) => a + b)
      this.averagePages = sum / uniqueSessionsCounts.length
    },
    drawChartPagesHits () {
      var uniquePages = []
      var uniquePagesTitle = []

      var allData = this.stats2
      if (this.filter.length > 0) {
        allData = allData.filter(item => item.pageName.includes(this.filter))
      }

      allData.forEach(item => {
        if (!uniquePages.some(rec => {
          return item.page === rec
        })) {
          uniquePages.push(item.page)
          uniquePagesTitle.push(item.pageName)
        }
      })
      uniquePages.sort()

      var uniquePageCounts = []
      uniquePages.forEach(page => {
        var count = allData.filter(item => item.page === page).length
        uniquePageCounts.push(count)
      })

      var options = {
        series: uniquePageCounts,
        chart: {
          id: 'chart1',
          type: 'pie'
        },
        labels: uniquePagesTitle,
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
      var chart = new ApexCharts(document.querySelector('#chartPagesHits'), options)
      chart.render()
    }
  }
}
</script>

<style scoped>
#chartPagesHits {
  max-width: 500px;
  margin: 35px auto;
}
</style>
