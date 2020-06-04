<template>
  <div class="stats">
    <h2>Stats: {{ msg.title }}</h2>
    <label>Editer status : <input type="text" v-model="msg.title"/></label>
    <h2>Content</h2>
    <label>{{ msg.content }}</label>
  </div>
</template>

<script>
import Vue from 'vue'
import VueResource from 'vue-resource'
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
  }
}
</script>
