<template>
  <div class="apps">
    <div class="page-head">
      <h1>Mes applications</h1>
      <p class="hint">
        Chaque application a son UUID, à passer à la librairie Android avec <code>AssConfig(appId = …)</code>.
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
        {{ apps.length }} / {{ maxApps }} applications<span v-if="full"> : supprimez-en une pour en créer une autre.</span>
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

export default {
  name: 'AppsPage',
  components: { CopyId },
  emits: ['authenticated'],
  data () {
    return { apps: [], loaded: false, newName: '', error: '', maxApps: 0 }
  },
  computed: {
    full () { return isFull(this.apps.length, this.maxApps) }
  },
  mounted () {
    this.load()
  },
  methods: {
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
.count { color: var(--muted); font-size: 0.9rem; }
</style>
