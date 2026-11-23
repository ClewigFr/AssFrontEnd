<template>
  <form
    id="login"
    @submit.prevent="login"
  >
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

<style scoped>
#login {
  max-width: 500px;
  box-sizing: border-box;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  margin: 200px auto 0;
  padding: 20px;
}
#login input, #login button { margin: 4px; }
.message { min-height: 1.2em; }
</style>
