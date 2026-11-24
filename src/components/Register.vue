<template>
  <form
    class="auth-card card"
    @submit.prevent="register"
  >
    <div class="brand">
      <AssLogo />
      Anonymous Simple Stats
    </div>
    <h1>Créer un compte</h1>
    <template v-if="!sent">
      <input
        v-model="email"
        type="email"
        name="email"
        autocomplete="username"
        placeholder="Adresse email"
        maxlength="128"
        required
      >
      <input
        v-model="displayName"
        type="text"
        name="displayName"
        autocomplete="name"
        placeholder="Nom (facultatif)"
        maxlength="256"
      >
      <input
        v-model="password"
        type="password"
        name="password"
        autocomplete="new-password"
        placeholder="Mot de passe (8 caractères minimum)"
        minlength="8"
        required
      >
      <!-- Honeypot: hidden from people (and screen readers), filled in by bots -->
      <div
        class="honeypot"
        aria-hidden="true"
      >
        <label>Site web <input
          v-model="website"
          type="text"
          name="website"
          tabindex="-1"
          autocomplete="off"
        ></label>
      </div>
      <div
        v-if="siteKey"
        ref="captcha"
      />
      <p class="hint terms">
        En créant un compte, vous acceptez les
        <router-link :to="{ name: 'terms' }">
          conditions d'utilisation
        </router-link>
        et la
        <router-link :to="{ name: 'privacy' }">
          politique de confidentialité
        </router-link>.
      </p>
      <button
        type="submit"
        :disabled="loading || !formToken || (siteKey && !captchaToken)"
      >
        Créer le compte
      </button>
    </template>
    <p
      v-else
      role="status"
    >
      Un mail vient de partir vers {{ email }} avec un lien valable 24 heures : ouvrez-le pour activer le compte. Pensez à regarder dans les indésirables.
    </p>
    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ error }}
    </p>
    <router-link :to="{ name: 'login' }">
      ← J'ai déjà un compte
    </router-link>
  </form>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'
import { renderTurnstile, resetTurnstile } from '@/turnstile'

export default {
  name: 'RegisterPage',
  components: { AssLogo },
  emits: ['authenticated'],
  data () {
    return {
      email: '', displayName: '', password: '', website: '',
      formToken: '', siteKey: null, captchaToken: '', widget: null,
      sent: false, loading: false, error: ''
    }
  },
  async mounted () {
    await this.loadForm()
  },
  methods: {
    async loadForm () {
      try {
        const form = await api.get('register/form')
        this.formToken = form.formToken
        if (form.turnstileSiteKey && !this.siteKey) {
          this.siteKey = form.turnstileSiteKey
          await this.$nextTick()
          this.widget = await renderTurnstile(this.$refs.captcha, this.siteKey, token => { this.captchaToken = token })
        }
      } catch {
        this.error = 'Serveur injoignable, réessayez plus tard.'
      }
    },
    async register () {
      this.error = ''
      this.loading = true
      try {
        const fields = {
          email: this.email, displayName: this.displayName, password: this.password,
          website: this.website, formToken: this.formToken
        }
        if (this.siteKey) fields['cf-turnstile-response'] = this.captchaToken
        const body = await api.postForm('register', fields)
        if (body === 'Check your email') this.sent = true
        else this.$emit('authenticated', true)
      } catch (error) {
        const body = typeof error.body === 'string' ? error.body : ''
        if (error.status === 400 && body.startsWith('Form expired')) {
          this.error = 'Le formulaire a expiré, il vient d\'être rechargé : renvoyez-le.'
          await this.loadForm()
        } else if (error.status === 400 && body.startsWith('Captcha')) {
          this.error = 'La vérification anti-robot a échoué, réessayez.'
        } else if (error.status === 400 && body.startsWith('Password')) {
          this.error = 'Le mot de passe doit faire de 8 caractères à 72 octets.'
        } else if (error.status === 400) {
          this.error = 'Adresse email invalide.'
        } else if (error.status === 409) {
          this.error = 'Un compte existe déjà avec cette adresse.'
        } else if (error.status === 403) {
          this.error = 'Les inscriptions sont fermées sur ce serveur.'
        } else if (error.status === 429) {
          this.error = 'Trop d\'inscriptions en ce moment, réessayez plus tard.'
        } else {
          this.error = 'Une erreur est survenue, réessayez.'
        }
        // A Turnstile token is single use
        this.captchaToken = ''
        resetTurnstile(this.widget)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
