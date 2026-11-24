<template>
  <form
    class="auth-card card"
    @submit.prevent="send"
  >
    <div class="brand">
      <AssLogo />
      Anonymous Simple Stats
    </div>
    <h1>Mot de passe oublié</h1>
    <template v-if="!sent">
      <p class="hint">
        Indiquez l'adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.
      </p>
      <input
        v-model="email"
        type="email"
        name="email"
        autocomplete="username"
        placeholder="Adresse email"
        maxlength="128"
        required
      >
      <button
        type="submit"
        :disabled="loading"
      >
        Envoyer le lien
      </button>
    </template>
    <p
      v-else
      role="status"
    >
      Si un compte existe pour {{ email }}, un mail vient de partir avec un lien valable une heure. Pensez à regarder dans les indésirables.
    </p>
    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ error }}
    </p>
    <router-link :to="{ name: 'login' }">
      ← Retour à la connexion
    </router-link>
  </form>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'

export default {
  name: 'ForgotPassword',
  components: { AssLogo },
  data () {
    return { email: '', sent: false, loading: false, error: '' }
  },
  methods: {
    async send () {
      this.error = ''
      this.loading = true
      try {
        await api.postJson('password/forgot', { email: this.email.trim() })
        this.sent = true
      } catch (error) {
        this.error = error.status === 429 ? 'Trop de demandes, réessayez dans une minute.'
          : 'Une erreur est survenue, réessayez.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
