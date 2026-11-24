<template>
  <div class="ass-app">
    <div id="nav">
      <template v-if="authenticated">
        <router-link :to="{ name: 'apps' }">
          Mes applications
        </router-link>
        <router-link :to="{ name: 'account' }">
          Mon compte
        </router-link>
        <a
          class="logout"
          href="#"
          @click.prevent="logout()"
        >Se déconnecter</a>
      </template>
      <p
        v-if="logoutError"
        class="logout-error"
        role="alert"
      >
        {{ logoutError }}
      </p>
    </div>
    <p
      v-if="authenticated && alert"
      class="quota-alert"
      role="alert"
    >
      {{ alert }}
      <router-link :to="{ name: 'account' }">
        Détails
      </router-link>
    </p>
    <router-view @authenticated="onAuthenticated" />
  </div>
</template>

<script>
import { api } from '@/api'
import { viewsAlert } from '@/quota'

export default {
  name: 'App',
  data () {
    return {
      authenticated: false,
      // Set once the user logs in or out: the startup session check must not override it
      authKnown: false,
      logoutError: '',
      alert: ''
    }
  },
  watch: {
    // Refreshed on each page change, so the alert follows the views without polling
    $route () { this.checkQuota() }
  },
  mounted () {
    // Ask the backend whether the session cookie is still valid
    api.get('login')
      .then(body => { if (!this.authKnown) this.setAuthenticated(body === 'Logged') })
      .catch(() => { if (!this.authKnown) this.setAuthenticated(false) })
  },
  methods: {
    // From the pages (login, or a 401): newer than the startup session check
    onAuthenticated (status) {
      this.authKnown = true
      return this.setAuthenticated(status)
    },
    async checkQuota () {
      if (!this.authenticated) { this.alert = ''; return }
      try {
        this.alert = viewsAlert(await api.get('account'))
      } catch {
        // Not worth an error: the pages report problems themselves
      }
    },
    async setAuthenticated (status) {
      this.authenticated = status
      if (!status) this.logoutError = ''
      this.checkQuota()
      await this.$router.isReady()
      // Logged out: always go to login. Logged in: leave the login page for the apps list.
      if (!status && this.$route.name !== 'login') {
        this.$router.replace({ name: 'login' })
      } else if (status && this.$route.name === 'login') {
        this.$router.replace({ name: 'apps' })
      }
    },
    logout () {
      this.logoutError = ''
      // Only show the user as logged out once the server has really ended the session
      return api.post('logout')
        .then(() => this.onAuthenticated(false))
        .catch(error => {
          if (error.status === 401) this.onAuthenticated(false)
          else this.logoutError = 'La déconnexion a échoué, réessayez.'
        })
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
.ass-app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#nav a { margin: 0 10px; }
#nav a.router-link-exact-active { font-weight: bold; }
.quota-alert {
  max-width: 720px;
  margin: 16px auto;
  padding: 10px 14px;
  border: 1px solid #e0b252;
  border-radius: 8px;
  background: #fff6e0;
  color: #7a5200;
}
.logout-error {
  color: #c0392b;
}
</style>
