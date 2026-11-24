<template>
  <div class="auth-card card">
    <div class="brand">
      <AssLogo />
      Anonymous Simple Stats
    </div>
    <h1>Confirmation de l'adresse</h1>
    <p
      v-if="!error"
      role="status"
    >
      Activation du compte…
    </p>
    <p
      v-else
      class="error"
      role="alert"
    >
      {{ error }}
    </p>
    <router-link :to="{ name: 'login' }">
      Se connecter
    </router-link>
  </div>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'

export default {
  name: 'VerifyEmail',
  components: { AssLogo },
  emits: ['authenticated'],
  data () {
    return { error: '' }
  },
  async mounted () {
    const token = this.$route.query.token || ''
    if (!token) { this.error = 'Ce lien est incomplet : ouvrez celui du mail, en entier.'; return }
    try {
      await api.postJson('register/verify', { token })
      this.$emit('authenticated', true)
    } catch (error) {
      this.error = error.status === 400
        ? 'Ce lien n\'est plus valable. Connectez-vous avec votre mot de passe : un nouveau lien vous sera envoyé.'
        : 'Une erreur est survenue, réessayez.'
    }
  }
}
</script>
