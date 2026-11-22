<template>
  <div id="app">
    <div id="nav">
      <a
        v-if="authenticated"
        href="#"
        @click.prevent="logout()"
      >Logout</a>
    </div>
    <router-view @authenticated="setAuthenticated" />
  </div>
</template>

<script>
import { api } from '@/api'

export default {
  name: 'App',
  data () {
    return {
      authenticated: false
    }
  },
  mounted () {
    // Ask the backend whether the session cookie is still valid
    api.get('login')
      .then(body => this.setAuthenticated(body === 'Logged'))
      .catch(() => this.setAuthenticated(false))
  },
  methods: {
    async setAuthenticated (status) {
      this.authenticated = status
      await this.$router.isReady()
      // Logged out: always go to login. Logged in: leave the login page for the apps list.
      if (!status && this.$route.name !== 'login') {
        this.$router.replace({ name: 'login' })
      } else if (status && this.$route.name === 'login') {
        this.$router.replace({ name: 'apps' })
      }
    },
    logout () {
      api.get('logout')
        .finally(() => this.setAuthenticated(false))
    }
  }
}
</script>

<style>
/* The colours below are designed for a light background: don't inherit a dark browser theme */
:root {
  color-scheme: light;
}
body {
  background: #ffffff;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
