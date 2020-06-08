<template>
  <div class="stats">
    <h2>Stats: {{ msg.title }}</h2>
    <label>Editer status : <input type="text" v-model="msg.title"/></label>
    <h2>Content</h2>
    <label>{{ msg.content }}</label>
    <div id="chart"></div>
    <h2>Json</h2>
    <ul v-for="stat in stats2.stats" :key="stat.stats">
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
        this.stats2 = json
        this.drawChart()
      }, response => {
        this.msg.content = 'erreur'
      })
  },
  methods: {
    drawChart () {
      var options = {
        chart: {
          type: 'line'
        },
        series: [{
          name: 'hits',
          data: [60, 70, 91, 35]
        }],
        xaxis: {
          categories: [25, 26, 27, 28]
        }
      }
      var chart = new ApexCharts(document.querySelector('#chart'), options)
      chart.render()
    }
  }
}
</script>

<style scoped>
#chart {
  max-width: 650px;
  margin: 35px auto;
}
</style>
