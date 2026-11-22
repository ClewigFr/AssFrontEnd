<template>
  <div class="app-detail">
    <router-link :to="{ name: 'apps' }">
      ← Mes applications
    </router-link>

    <template v-if="app">
      <h1>{{ app.name }}</h1>
      <p class="hint">
        UUID de l'application, à passer à la librairie (<code>AssConfig(appId = …)</code>) :
      </p>
      <CopyId :id="app.id" />

      <h2>Pages suivies</h2>
      <form
        class="create"
        @submit.prevent="addPage"
      >
        <input
          v-model="newPage"
          type="text"
          name="pageName"
          placeholder="Nom de la nouvelle page"
          maxlength="255"
        >
        <button
          type="submit"
          :disabled="!newPage.trim()"
        >
          Ajouter
        </button>
      </form>
      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
      <p
        v-if="pages.length === 0"
        class="hint"
      >
        Ajoutez une page, puis appelez <code>logScreen("&lt;UUID de la page&gt;")</code> quand elle s'affiche.
      </p>
      <table
        v-else
        class="pages"
      >
        <tr
          v-for="page in pages"
          :key="page.id"
        >
          <td>{{ page.name }}</td>
          <td><CopyId :id="page.id" /></td>
          <td>
            <button
              type="button"
              class="danger"
              @click="removePage(page)"
            >
              Supprimer
            </button>
          </td>
        </tr>
      </table>

      <StatsPage
        ref="stats"
        :app-id="app.id"
        @authenticated="$emit('authenticated', $event)"
      />

      <p class="delete-app">
        <button
          type="button"
          class="danger"
          @click="removeApp"
        >
          Supprimer l'application
        </button>
      </p>
    </template>
    <p v-else-if="notFound">
      Application introuvable.
    </p>
  </div>
</template>

<script>
import { api } from '@/api'
import CopyId from '@/components/CopyId.vue'
import StatsPage from '@/components/Stats.vue'

export default {
  name: 'AppDetail',
  components: { CopyId, StatsPage },
  props: {
    id: { type: String, required: true }
  },
  emits: ['authenticated'],
  data () {
    return { app: null, pages: [], notFound: false, newPage: '', error: '' }
  },
  mounted () {
    this.load()
  },
  methods: {
    load () {
      return api.get(`apps/${this.id}`)
        .then(json => { this.app = json.app; this.pages = json.pages })
        .catch(this.handleError)
    },
    async addPage () {
      const name = this.newPage.trim()
      if (!name) return
      this.error = ''
      try {
        await api.postJson(`apps/${this.id}/pages`, { name })
        this.newPage = ''
        await this.load()
        this.$refs.stats?.load()
      } catch (error) {
        this.handleError(error)
      }
    },
    async removePage (page) {
      if (!confirm(`Supprimer la page « ${page.name} » et toutes ses vues ? C'est définitif.`)) return
      try {
        await api.delete(`apps/${this.id}/pages/${page.id}`)
        await this.load()
        this.$refs.stats?.load()
      } catch (error) {
        this.handleError(error)
      }
    },
    async removeApp () {
      if (!confirm(`Supprimer l'application « ${this.app.name} », ses pages et toutes ses vues ? C'est définitif.`)) return
      try {
        await api.delete(`apps/${this.id}`)
        this.$router.push({ name: 'apps' })
      } catch (error) {
        this.handleError(error)
      }
    },
    handleError (error) {
      if (error.status === 401) this.$emit('authenticated', false)
      else if (error.status === 404) this.notFound = true
      else this.error = 'Une erreur est survenue, réessayez.'
    }
  }
}
</script>

<style scoped>
.app-detail { max-width: 720px; margin: 0 auto; }
.hint { color: #666; }
.create { margin: 12px 0; }
.create input { width: 60%; }
.pages { margin: 0 auto; border-collapse: collapse; }
.pages td { padding: 6px 10px; border-bottom: 1px solid #eee; text-align: left; }
.danger { color: #c0392b; }
.delete-app { margin-top: 40px; }
.error { color: #c0392b; }
</style>
