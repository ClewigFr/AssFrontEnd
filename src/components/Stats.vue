<template>
  <div class="stats">
    <h2>Stats: {{ msg.title }}</h2>
    <label>Editer status : <input type="text" v-model="msg.title"/></label>
    <h2>Content</h2>
    <label>{{ msg.content }}</label>
    <div id="chart"></div>
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
      }
    }
  },
  http: {
    root: 'https://gentle-inlet-02091.herokuapp.com'
  },
  mounted () {
    this.msg.title = 'Loading...'
    this.$resource('stats')
      .get()
      .then(
        response => {
          this.msg.title = 'Loaded'
          this.msg.content = response.body
        }
      )

    var options = {
      chart: {
        type: 'line'
      },
      series: [{
        name: 'hits',
        data: [60, 70, 91, 125]
      }],
      xaxis: {
        categories: [25, 26, 27, 28]
      }
    }
    var chart = new ApexCharts(document.querySelector('#chart'), options)
    chart.render()
  }
}
</script>

<style scoped>
#chart {
  max-width: 650px;
  margin: 35px auto;
}
</style>
