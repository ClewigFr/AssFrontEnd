<template>
  <div id="app">
    <div id="nav">
      <a v-if="authenticated" href="#" v-on:click.prevent="logout()">Logout</a>
    </div>
    <router-view @authenticated="setAuthenticated" />
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      authenticated: false
    }
  },
  mounted () {
    // Ask the backend whether the session cookie is still valid
    this.$http.get('login')
      .then(response => {
        this.setAuthenticated(response.body === 'Logged')
      }, () => {
        this.setAuthenticated(false)
      })
  },
  methods: {
    setAuthenticated (status) {
      this.authenticated = status
      const target = status ? 'stats' : 'login'
      if (this.$route.name !== target) {
        this.$router.replace({ name: target })
      }
    },
    logout () {
      this.$http.get('logout')
        .then(() => this.setAuthenticated(false), () => this.setAuthenticated(false))
    }
  }
}
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
