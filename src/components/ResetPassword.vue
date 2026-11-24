<template>
  <form
    class="auth-card card"
    @submit.prevent="reset"
  >
    <div class="brand">
      <AssLogo />
      Anonymous Simple Stats
    </div>
    <h1>Nouveau mot de passe</h1>
    <template v-if="!done">
      <input
        v-model="password"
        type="password"
        name="new"
        autocomplete="new-password"
        placeholder="Nouveau mot de passe (8 caractères minimum)"
        minlength="8"
        required
      >
      <input
        v-model="confirmation"
        type="password"
        name="confirm"
        autocomplete="new-password"
        placeholder="Nouveau mot de passe, encore"
        required
      >
      <button
        type="submit"
        :disabled="loading || !token"
      >
        Changer le mot de passe
      </button>
    </template>
    <p
      v-else
      role="status"
    >
      Mot de passe changé. Vos appareils ont été déconnectés : connectez-vous avec le nouveau mot de passe.
    </p>
    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ error }}
    </p>
    <router-link :to="{ name: done ? 'login' : 'forgot' }">
      {{ done ? 'Se connecter' : 'Demander un nouveau lien' }}
    </router-link>
  </form>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'

export default {
  name: 'ResetPassword',
  components: { AssLogo },
  data () {
    return { password: '', confirmation: '', done: false, loading: false, error: '' }
  },
  computed: {
    token () { return this.$route.query.token || '' }
  },
  watch: {
    // Another link opened in the same tab: start over
    token (token) {
      if (token) Object.assign(this, { password: '', confirmation: '', done: false, error: '' })
    }
  },
  mounted () {
    if (!this.token) this.error = 'Ce lien est incomplet : ouvrez celui du mail, en entier.'
  },
  methods: {
    async reset () {
      this.error = ''
      if (this.password !== this.confirmation) {
        this.error = 'Les deux mots de passe sont différents.'
        return
      }
      this.loading = true
      try {
        await api.postJson('password/reset', { token: this.token, new: this.password })
        this.done = true
        // The token is used up: don't leave it in the address bar
        this.$router.replace({ query: {} })
      } catch (error) {
        if (error.status === 400 && typeof error.body === 'string' && error.body.startsWith('Password')) {
          this.error = 'Le mot de passe doit faire de 8 caractères à 72 octets.'
        } else if (error.status === 400) {
          this.error = 'Ce lien n\'est plus valable (déjà utilisé, ou plus d\'une heure). Demandez-en un nouveau.'
        } else {
          this.error = error.status === 429 ? 'Trop de tentatives, réessayez dans une minute.' : 'Une erreur est survenue, réessayez.'
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
