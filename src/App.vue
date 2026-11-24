<template>
  <div class="ass-app">
    <header
      v-if="authenticated && !isHome"
      class="topbar"
    >
      <div class="topbar-inner">
        <router-link
          :to="{ name: 'apps' }"
          class="brand"
        >
          <AssLogo />
          <span class="brand-name">Anonymous Simple Stats</span>
        </router-link>
        <nav id="nav">
          <router-link :to="{ name: 'apps' }">
            Applications
          </router-link>
          <router-link :to="{ name: 'account' }">
            Mon compte
          </router-link>
          <a
            class="logout"
            href="#"
            @click.prevent="logout()"
          >Se déconnecter</a>
        </nav>
      </div>
    </header>
    <main class="content">
      <p
        v-if="logoutError"
        class="banner danger"
        role="alert"
      >
        {{ logoutError }}
      </p>
      <p
        v-if="authenticated && alert && !isHome"
        class="banner warning"
        role="alert"
      >
        {{ alert }}
        <router-link :to="{ name: 'account' }">
          Détails
        </router-link>
      </p>
      <router-view @authenticated="onAuthenticated" />
    </main>
  </div>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'
import { viewsAlert } from '@/quota'
import { PUBLIC_ROUTES } from '@/router'

export default {
  name: 'App',
  components: { AssLogo },
  data () {
    return {
      authenticated: false,
      // Set once the user logs in or out: the startup session check must not override it
      authKnown: false,
      logoutError: '',
      alert: ''
    }
  },
  computed: {
    // The public presentation page has its own header
    isHome () { return this.$route.name === 'home' }
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
      // Logged out: go to login, unless on a page that doesn't need it (forgotten password).
      // Logged in: leave the login page for the apps list.
      if (!status && !PUBLIC_ROUTES.includes(this.$route.name)) {
        this.$router.replace({ name: 'login' })
      } else if (status && ['login', 'register', 'verify'].includes(this.$route.name)) {
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
.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.brand { display: flex; align-items: center; gap: 10px; color: var(--text); font-weight: 700; }
.brand:hover { text-decoration: none; }
#nav { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
#nav a { color: var(--muted); padding: 6px 10px; border-radius: var(--radius-sm); font-weight: 500; }
#nav a:hover { background: var(--surface-2); color: var(--text); text-decoration: none; }
#nav a.router-link-active { color: var(--text); background: var(--surface-2); }
.content { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
@media (max-width: 600px) {
  .brand-name { display: none; }
  #nav { flex-wrap: nowrap; gap: 0; }
  #nav a { padding: 6px 7px; font-size: 0.85rem; white-space: nowrap; }
  .content { padding-top: 16px; }
}
</style>
