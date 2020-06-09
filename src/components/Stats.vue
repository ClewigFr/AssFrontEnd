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
    <label>Pages / session : {{ averagePages.toFixed(1) }}</label>
    <div id="chartSessions"></div>
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
      // stats: [{
      //   page: 'demo',
      //   sessionId: 'azerty',
      //   timestamp: 0,
      //   pageName: 'pouet'
      // }],
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
      var dates = []
      this.uniqueSessions = []
      this.stats2.forEach(item => {
        // handle sessions
        if (!this.uniqueSessions.some(rec => {
          return item.sessionId === rec
        })) {
          this.uniqueSessions.push(item.sessionId)
        }
        // handle dates
        if (item.timestamp > 100000) { // prevent from wrong datas
          var date = new Date(item.timestamp)
          var formattedDate = date.getDate() + '/' + (date.getMonth() + 1)
          if (!dates.some(rec => {
            return formattedDate === rec.date
          })) {
            dates.push({'date': formattedDate, 'sessions': [item.sessionId], 'total': 1})
          } else {
            var dateItem = dates.filter(item => item.date === formattedDate)[0]
            var index = dates.indexOf(dateItem)
            if (index >= 0) {
              dates[index].total = dates[index].total + 1
              if (!dates[index].sessions.some(sessionId => sessionId === item.sessionId)) {
                dates[index].sessions.push(item.sessionId)
              }
            }
          }
        }
      })
      dates.sort((a, b) => a.date > b.date)

      // compute sessions average
      var uniqueSessionsCounts = []
      this.uniqueSessions.forEach(session => {
        var sameSessions = this.stats2.filter(item => item.sessionId === session)
        uniqueSessionsCounts.push(sameSessions.length)
      })
      var sum = uniqueSessionsCounts.reduce((a, b) => a + b)
      this.averagePages = sum / uniqueSessionsCounts.length

      // draw
      var options = {
        chart: {
          type: 'area'
        },
        series: [{
          name: 'Sessions (unique)',
          data: dates.map(item => item.sessions.length)
        },
        {
          name: 'Sessions (total)',
          data: dates.map(item => item.total)
        }],
        xaxis: {
          categories: dates.map(item => item.date)
        }
      }
      var chart = new ApexCharts(document.querySelector('#chartSessions'), options)
      chart.render()
    },
    drawChartPagesHits () {
      var uniquePages = []
      var uniquePagesTitle = []

      // compute data
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
      // draw
      var options = {
        series: uniquePageCounts,
        chart: {
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
#chartSessions {
  max-width: 600px;
  margin: 35px auto;
}
</style>
