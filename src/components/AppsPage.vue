<template>
  <div class="apps">
    <div class="page-head">
      <h1>Mes applications</h1>
      <p class="hint">
        Chaque application a son UUID, à passer à la librairie Android ou iOS avec <code>AssConfig(appId = …)</code>.
      </p>
    </div>

    <section class="card">
      <form
        class="inline-form"
        @submit.prevent="create"
      >
        <input
          v-model="newName"
          type="text"
          name="appName"
          placeholder="Nom de la nouvelle application"
          maxlength="255"
        >
        <button
          type="submit"
          :disabled="!newName.trim() || full"
        >
          Créer
        </button>
      </form>
      <p
        v-if="maxApps"
        class="hint quota"
      >
        {{ ownedCount }} / {{ maxApps }} applications<span v-if="full"> : supprimez-en une pour en créer une autre.</span>
      </p>
      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
    </section>

    <p
      v-if="loaded && apps.length === 0"
      class="hint empty"
    >
      Aucune application pour l'instant. Créez-en une pour obtenir l'UUID à configurer dans la librairie.
    </p>

    <ul class="list">
      <li
        v-for="app in apps"
        :key="app.id"
        class="card"
      >
        <router-link
          :to="{ name: 'app', params: { id: app.id } }"
          class="name"
        >
          {{ app.name }}
        </router-link>
        <span
          v-if="isShared(app)"
          class="badge"
          :title="'Partagée par ' + app.owner"
        >Partagée · {{ ROLE_LABELS[app.role] }}</span>
        <span class="count">{{ app.pages }} page{{ app.pages > 1 ? 's' : '' }}</span>
        <CopyId :id="app.id" />
      </li>
    </ul>
  </div>
</template>

<script>
import { api } from '@/api'
import CopyId from '@/components/CopyId.vue'
import { isFull, quotaError } from '@/quota'
import { isShared, ROLE_LABELS } from '@/roles'

export default {
  name: 'AppsPage',
  components: { CopyId },
  emits: ['authenticated'],
  data () {
    return { apps: [], loaded: false, newName: '', error: '', maxApps: 0 }
  },
  computed: {
    // Shared applications count for their owner's quota, not this account's
    ownedCount () { return this.apps.filter(app => !isShared(app)).length },
    full () { return isFull(this.ownedCount, this.maxApps) },
    ROLE_LABELS: () => ROLE_LABELS
  },
  mounted () {
    this.load()
  },
  methods: {
    isShared,
    load () {
      api.get('account').then(account => { this.maxApps = account.quotas.maxApps }).catch(() => {})
      return api.get('apps')
        .then(json => { this.apps = json.apps; this.loaded = true })
        .catch(this.handleError)
    },
    create () {
      const name = this.newName.trim()
      if (!name) return
      this.error = ''
      api.postJson('apps', { name })
        .then(app => {
          this.newName = ''
          this.$router.push({ name: 'app', params: { id: app.id } })
        })
        .catch(this.handleError)
    },
    handleError (error) {
      if (error.status === 401) this.$emit('authenticated', false)
      else this.error = quotaError(error) || 'Une erreur est survenue, réessayez.'
    }
  }
}
</script>

<style scoped>
.quota { margin: 0; }
.empty { text-align: center; padding: 24px 0; }
.list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.list li { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.name { font-weight: 700; font-size: 1.1rem; color: var(--text); }
.name:hover { color: var(--primary); }
.badge { align-self: flex-start; font-size: 0.8rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--primary-soft, rgba(0, 0, 0, 0.06)); color: var(--primary); }
.count { color: var(--muted); font-size: 0.9rem; }
</style>
