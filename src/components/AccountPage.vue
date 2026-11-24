<template>
  <div class="account">
    <div class="page-head">
      <h1>Mon compte</h1>
      <p
        v-if="account"
        class="hint"
      >
        {{ account.displayName ? `${account.displayName} · ${account.email}` : account.email }}
      </p>
    </div>
    <p
      v-if="error"
      class="banner danger"
    >
      {{ error }}
    </p>

    <template v-if="account">
      <section class="card">
        <h2>Utilisation</h2>
        <dl class="usage">
          <dt>Applications</dt>
          <dd>
            {{ usageText(account.usage.apps, account.quotas.maxApps) }}
            <meter
              v-if="account.quotas.maxApps"
              :value="account.usage.apps"
              min="0"
              :max="account.quotas.maxApps"
            />
          </dd>
          <dt>Pages par application</dt>
          <dd>{{ account.quotas.maxPagesPerApp ? `${account.quotas.maxPagesPerApp} au maximum` : 'illimité' }}</dd>
          <dt>Vues depuis le {{ monthStartText }}</dt>
          <dd :class="{ over: overViews }">
            {{ usageText(account.usage.monthViews, account.quotas.maxMonthlyViews) }}
            <meter
              v-if="account.quotas.maxMonthlyViews"
              :value="Math.min(account.usage.monthViews, account.quotas.maxMonthlyViews)"
              min="0"
              :max="account.quotas.maxMonthlyViews"
              :high="account.quotas.maxMonthlyViews * 0.8"
              :optimum="0"
            />
          </dd>
        </dl>
        <p
          v-if="overViews"
          class="hint"
        >
          Le quota mensuel est dépassé : les vues continuent d'être enregistrées. Le compteur repart à zéro le 1ᵉʳ du mois (UTC).
        </p>
      </section>

      <section class="card">
        <h2>Changer le mot de passe</h2>
        <form
          class="stack"
          @submit.prevent="changePassword"
        >
          <input
            v-model="current"
            type="password"
            name="current"
            autocomplete="current-password"
            placeholder="Mot de passe actuel"
            required
          >
          <input
            v-model="next"
            type="password"
            name="new"
            autocomplete="new-password"
            placeholder="Nouveau mot de passe (8 caractères minimum)"
            minlength="8"
            required
          >
          <input
            v-model="confirmNext"
            type="password"
            name="confirm"
            autocomplete="new-password"
            placeholder="Nouveau mot de passe, encore"
            required
          >
          <button
            type="submit"
            :disabled="busy"
          >
            Changer le mot de passe
          </button>
        </form>
        <p
          v-if="passwordMessage"
          :class="passwordOk ? 'ok' : 'error'"
          role="status"
        >
          {{ passwordMessage }}
        </p>
      </section>

      <section class="card danger-zone">
        <h2>Supprimer le compte</h2>
        <p class="hint">
          Supprime le compte, ses applications, leurs pages et toutes leurs vues. C'est définitif.
        </p>
        <form
          class="stack"
          @submit.prevent="deleteAccount"
        >
          <input
            v-model="deletePassword"
            type="password"
            name="deletePassword"
            autocomplete="current-password"
            placeholder="Mot de passe"
            required
          >
          <button
            type="submit"
            class="danger"
            :disabled="busy"
          >
            Supprimer mon compte
          </button>
        </form>
        <p
          v-if="deleteError"
          class="error"
        >
          {{ deleteError }}
        </p>
      </section>
    </template>
  </div>
</template>

<script>
import { api } from '@/api'
import { isFull, usageText } from '@/quota'

export default {
  name: 'AccountPage',
  emits: ['authenticated'],
  data () {
    return {
      account: null,
      error: '',
      current: '',
      next: '',
      confirmNext: '',
      passwordMessage: '',
      passwordOk: false,
      deletePassword: '',
      deleteError: '',
      busy: false
    }
  },
  computed: {
    overViews () {
      return isFull(this.account.usage.monthViews, this.account.quotas.maxMonthlyViews)
    },
    monthStartText () {
      // The 1st of the month, in UTC like the backend's count: "1er novembre"
      return '1er ' + new Date(this.account.usage.monthStart).toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' })
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    usageText,
    async load () {
      try {
        this.account = await api.get('account')
      } catch (error) {
        if (error.status === 401) this.$emit('authenticated', false)
        else this.error = 'Une erreur est survenue, réessayez.'
      }
    },
    async changePassword () {
      this.passwordMessage = ''
      this.passwordOk = false
      if (this.next !== this.confirmNext) {
        this.passwordMessage = 'Les deux nouveaux mots de passe sont différents.'
        return
      }
      this.busy = true
      try {
        await api.postJson('account/password', { current: this.current, new: this.next })
        Object.assign(this, { current: '', next: '', confirmNext: '' })
        this.passwordOk = true
        this.passwordMessage = 'Mot de passe changé. Vos autres appareils ont été déconnectés.'
      } catch (error) {
        if (error.status === 401) return this.$emit('authenticated', false)
        this.passwordMessage = error.status === 403 ? 'Mot de passe actuel incorrect.'
          : error.status === 400 ? 'Le nouveau mot de passe doit faire de 8 caractères à 72 octets.'
            : error.status === 429 ? 'Trop de tentatives, réessayez dans une minute.'
              : 'Une erreur est survenue, réessayez.'
      } finally {
        this.busy = false
      }
    },
    async deleteAccount () {
      this.deleteError = ''
      if (!confirm('Supprimer votre compte, vos applications et toutes leurs vues ? C\'est définitif.')) return
      this.busy = true
      try {
        await api.deleteJson('account', { password: this.deletePassword })
        this.$emit('authenticated', false)
      } catch (error) {
        if (error.status === 401) return this.$emit('authenticated', false)
        this.deleteError = error.status === 403 ? 'Mot de passe incorrect.'
          : error.status === 429 ? 'Trop de tentatives, réessayez dans une minute.'
            : 'Une erreur est survenue, réessayez.'
      } finally {
        this.busy = false
      }
    }
  }
}
</script>

<style scoped>
.account { max-width: 640px; margin: 0 auto; }
.usage { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; margin: 0 0 8px; align-items: center; }
.usage dt { color: var(--muted); }
.usage dd { margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-variant-numeric: tabular-nums; font-weight: 600; }
.usage meter { width: 160px; height: 10px; }
.over { color: var(--warning-text); }
.stack { max-width: 380px; }
.stack button { align-self: flex-start; }
.danger-zone { border-color: var(--danger-soft); }
@media (max-width: 520px) {
  .usage { grid-template-columns: 1fr; gap: 2px; }
  .usage dd { margin-bottom: 10px; }
}
</style>
