<template>
  <div class="stats">
    <!-- <h2>Stats: {{ msg.title }}</h2> -->
    <!-- <label>{{ msg.content }}</label> -->

    <h2>Sessions</h2>
    <label>Total évenements : {{ this.stats.length }}</label>
    <br />
    <label>Sessions uniques : {{ uniqueSessions.length }}</label>
    <br />
    <label>Pages vues / session : {{ averagePages.toFixed(1) }}</label>
    <div id="chartSessions"></div>

    <h2>Pages</h2>
    <label>
      Filtrer page :
      <input type="text" v-model="pageFilter" />
    </label>
    <!-- <label>PageFilter : {{ pageFilter }}</label> -->
    <div id="chartPagesHits">
      <apexchart width="500" type="pie" :options="options" :series="series"></apexchart>
    </div>
    <!-- <h2>Json</h2>
    <ul v-for="stat in stats" :key="stat.page">
      <li> {{ stat.page }} / {{ stat.sessionId }} / {{ stat.timestamp }} / {{ stat.pageName }} </li>
    </ul>-->
  </div>
</template>

<script>
import Vue from "vue";
import VueResource from "vue-resource";
import ApexCharts from "apexcharts";
import VueApexCharts from "vue-apexcharts";

Vue.use(VueResource);
Vue.component("apexchart", VueApexCharts);

export default {
  name: "Stats",
  data() {
    return {
      msg: {
        title: "Stats",
        content: "Chargement..."
      },
      stats: [],
      pages: [],
      uniqueSessions: [],
      averagePages: 0,
      filter: "",
      options: {},
      series: []
    };
  },
  computed: {
    pageFilter: {
      get() {
        return this.filter;
      },
      set(newVal) {
        this.filter = newVal;
        this.drawChartPagesHits();
      }
    }
  },
  http: {
    root: "https://gentle-inlet-02091.herokuapp.com"
  },
  mounted() {
    this.msg.title = "Chargement...";

    this.$resource("stats/json")
      .get()
      .then(response => response.json())
      .then(
        json => {
          this.msg.title = "Loaded";
          this.msg.content = "ok";
          this.stats = json.stats;
          this.pages = json.pages;
          this.drawChartPagesHits();
          this.drawChartSession();
        },
        response => {
          this.msg.content = "Erreur";
        }
      );
  },
  methods: {
    drawChartSession() {
      var dates = [];
      this.uniqueSessions = [];
      this.stats.forEach(item => {
        // handle sessions
        if (
          !this.uniqueSessions.some(rec => {
            return item.sessionId === rec;
          })
        ) {
          this.uniqueSessions.push(item.sessionId);
        }
        // handle dates
        if (item.timestamp > 100000) {
          // prevent from wrong data
          var date = new Date(item.timestamp);
          var formattedDate = date.getDate() + "/" + (date.getMonth() + 1);
          if (
            !dates.some(rec => {
              return formattedDate === rec.formattedDate;
            })
          ) {
            dates.push({
              date: date,
              formattedDate: formattedDate,
              sessions: [item.sessionId],
              total: 1
            });
          } else {
            var dateItem = dates.filter(
              item => item.formattedDate === formattedDate
            )[0];
            var index = dates.indexOf(dateItem);
            if (index >= 0) {
              dates[index].total = dates[index].total + 1;
              if (
                !dates[index].sessions.some(
                  sessionId => sessionId === item.sessionId
                )
              ) {
                dates[index].sessions.push(item.sessionId);
              }
            }
          }
        }
      });
      dates.sort((a, b) => a.date > b.date);

      // compute sessions average
      var uniqueSessionsCounts = [];
      this.uniqueSessions.forEach(session => {
        var sameSessions = this.stats.filter(
          item => item.sessionId === session
        );
        uniqueSessionsCounts.push(sameSessions.length);
      });
      var sum = uniqueSessionsCounts.reduce((a, b) => a + b);
      this.averagePages = sum / uniqueSessionsCounts.length;

      // draw
      var options = {
        chart: {
          type: "area"
        },
        series: [
          {
            name: "Sessions (unique)",
            data: dates.map(item => item.sessions.length)
          },
          {
            name: "Sessions (total)",
            data: dates.map(item => item.total)
          }
        ],
        xaxis: {
          categories: dates.map(item => item.formattedDate)
        }
      };
      var chart = new ApexCharts(
        document.querySelector("#chartSessions"),
        options
      );
      chart.render();
    },
    drawChartPagesHits() {
      // filter data
      var filtredPages = this.pages;
      if (this.filter.length > 0) {
        filtredPages = filtredPages.filter(item =>
          item.name.includes(this.filter)
        );
      }
      // compute data
      var uniquePageCounts = [];
      filtredPages.forEach(page => {
        var count = this.stats.filter(item => item.page === page.id).length;
        uniquePageCounts.push(count);
      });
      // In the same way, update the series option
      this.series = uniquePageCounts;
      this.options = {
        labels: filtredPages.map(item => item.name),
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 400
              },
              legend: {
                position: "bottom"
              }
            }
          }
        ]
      };
    }
  }
};
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
