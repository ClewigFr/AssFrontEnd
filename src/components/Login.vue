<template>
  <form
    id="login"
    class="auth-card card"
    @submit.prevent="login"
  >
    <div class="brand">
      <span
        class="logo"
        aria-hidden="true"
      >A</span>
      Anonymous Simple Stats
    </div>
    <h1>Connexion</h1>
    <input
      v-model="input.username"
      type="text"
      name="username"
      autocomplete="username"
      placeholder="Identifiant"
      required
    >
    <input
      v-model="input.password"
      type="password"
      name="password"
      autocomplete="current-password"
      placeholder="Mot de passe"
      required
    >
    <button
      type="submit"
      :disabled="loading"
    >
      Se connecter
    </button>
    <p
      class="message"
      role="alert"
    >
      {{ input.error }}
    </p>
    <router-link
      :to="{ name: 'forgot' }"
      class="hint"
    >
      Mot de passe oublié ?
    </router-link>
  </form>
</template>

<script>
import { api } from '@/api'

export default {
  name: 'LoginPage',
  emits: ['authenticated'],
  data () {
    return {
      loading: false,
      input: {
        username: '',
        password: '',
        error: ''
      }
    }
  },
  methods: {
    login () {
      this.loading = true
      this.input.error = 'Connexion…'
      api.postForm('login', { userId: this.input.username, password: this.input.password })
        .then(body => {
          if (body === 'Logged') {
            this.input.error = ''
            this.$emit('authenticated', true)
          } else {
            this.input.error = 'Identifiant ou mot de passe incorrect.'
          }
        })
        .catch(error => {
          if (error.status === 429) this.input.error = 'Trop de tentatives échouées, réessayez dans 15 minutes.'
          else if (error.status === 401 || error.status === 403) this.input.error = 'Identifiant ou mot de passe incorrect.'
          else this.input.error = 'Serveur injoignable, réessayez plus tard.'
        })
        .finally(() => { this.loading = false })
    }
  }
}
</script>
