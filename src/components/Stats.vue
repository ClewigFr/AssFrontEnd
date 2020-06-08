<template>
  <div class="stats">
    <h2>Stats: {{ msg.title }}</h2>
    <label>Editer status : <input type="text" v-model="msg.title"/></label>
    <h2>Content</h2>
    <label>{{ msg.content }}</label>
    <div id="chart"></div>
    <h2>Json</h2>
    <ul v-for="stat in stats2" :key="stat.page">
      <li> {{ stat.page }} / {{ stat.sessionId }} / {{ stat.timestamp }} / {{ stat.pageName }} </li>
    </ul>
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
      stats2: []
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
        this.drawChart()
      }, response => {
        this.msg.content = 'erreur'
      })
  },
  methods: {
    drawChart () {
      var uniquePages = []
      this.stats2.forEach(item => {
        if (!uniquePages.some(rec => {
          return item.pageName === rec
        })) {
          uniquePages.push(item.pageName)
        }
      })
      uniquePages.sort()
      // this.msg.content = uniquePages

      var uniquePageCounts = []
      uniquePages.forEach(page => {
        var count = this.stats2.filter(item => item.pageName === page).length
        uniquePageCounts.push(count)
      })
      
      var options = {
          series: uniquePageCounts,
          chart: {
          type: 'pie',
        },
        labels: uniquePages,
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
      var chart = new ApexCharts(document.querySelector('#chart'), options)
      chart.render()
    }
  }
}
</script>

<style scoped>
#chart {
  max-width: 500px;
  margin: 35px auto;
}
</style>
