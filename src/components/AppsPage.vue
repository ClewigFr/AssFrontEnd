<template>
  <div class="apps">
    <h1>Mes applications</h1>

    <form
      class="create"
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
        :disabled="!newName.trim()"
      >
        Créer
      </button>
    </form>
    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>

    <p v-if="loaded && apps.length === 0">
      Aucune application pour l'instant. Créez-en une pour obtenir l'UUID à configurer dans la librairie.
    </p>

    <ul class="list">
      <li
        v-for="app in apps"
        :key="app.id"
      >
        <router-link :to="{ name: 'app', params: { id: app.id } }">
          {{ app.name }}
        </router-link>
        <span class="count">{{ app.pages }} page{{ app.pages > 1 ? 's' : '' }}</span>
        <div><CopyId :id="app.id" /></div>
      </li>
    </ul>
  </div>
</template>

<script>
import { api } from '@/api'
import CopyId from '@/components/CopyId.vue'

export default {
  name: 'AppsPage',
  components: { CopyId },
  emits: ['authenticated'],
  data () {
    return { apps: [], loaded: false, newName: '', error: '' }
  },
  mounted () {
    this.load()
  },
  methods: {
    load () {
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
      else this.error = 'Une erreur est survenue, réessayez.'
    }
  }
}
</script>

<style scoped>
.apps { max-width: 640px; margin: 0 auto; }
.create { margin: 20px 0; }
.create input { width: 60%; }
.list { list-style: none; padding: 0; text-align: left; }
.list li { border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
.list a { font-weight: bold; font-size: 1.1em; }
.count { color: #888; margin-left: 8px; }
.error { color: #c0392b; }
</style>
