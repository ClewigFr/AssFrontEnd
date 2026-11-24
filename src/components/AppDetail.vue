<template>
  <div class="app-detail">
    <router-link :to="{ name: 'apps' }">
      ← Mes applications
    </router-link>

    <template v-if="app">
      <h1>{{ app.name }}</h1>
      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
      <div
        class="tabs"
        role="tablist"
      >
        <button
          v-for="t in tabs"
          :id="'tab-' + t.key"
          :key="t.key"
          type="button"
          role="tab"
          :aria-controls="'panel-' + t.key"
          :aria-selected="t.key === tab"
          :class="{ active: t.key === tab }"
          @click="setTab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>

      <div
        v-if="tab === 'stats'"
        id="panel-stats"
        role="tabpanel"
        aria-labelledby="tab-stats"
      >
        <p
          v-if="pages.length === 0"
          class="hint"
        >
          Aucune page suivie pour l'instant : ajoutez-en dans l'onglet
          <a
            href="#"
            @click.prevent="setTab('config')"
          >Configuration</a>.
        </p>
        <StatsPage
          :app-id="app.id"
          @authenticated="$emit('authenticated', $event)"
        />
      </div>

      <div
        v-else
        id="panel-config"
        role="tabpanel"
        aria-labelledby="tab-config"
      >
        <p class="hint">
          UUID de l'application, à passer à la librairie (<code>AssConfig(appId = …)</code>) :
        </p>
        <CopyId :id="app.id" />

        <h2>Pages suivies</h2>
        <p
          v-if="maxPages"
          class="hint"
        >
          {{ pages.length }} / {{ maxPages }} pages<span v-if="full"> : supprimez-en une pour en ajouter une autre.</span>
        </p>
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
            :disabled="!newPage.trim() || full"
          >
            Ajouter
          </button>
        </form>
        <p class="csv">
          <input
            ref="csvFile"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            hidden
            @change="importCsv"
          >
          <button
            type="button"
            :disabled="importing || full"
            title="Un nom de page par ligne, dans la première colonne"
            @click="$refs.csvFile.click()"
          >
            {{ importing ? 'Import…' : 'Importer un CSV' }}
          </button>
          <button
            type="button"
            :disabled="pages.length === 0"
            title="name, id, app_id : de quoi appeler logScreen pour chaque page"
            @click="exportCsv"
          >
            Exporter en CSV
          </button>
        </p>
        <p
          v-if="importResult"
          class="hint"
        >
          {{ importResult }}
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

        <p class="delete-app">
          <button
            type="button"
            class="danger"
            @click="removeApp"
          >
            Supprimer l'application
          </button>
        </p>
      </div>
    </template>
    <p v-else-if="notFound">
      Application introuvable.
    </p>
    <p
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script>
import { api } from '@/api'
import CopyId from '@/components/CopyId.vue'
import { isFull, quotaError } from '@/quota'
import { csvFileName, pageNamesFromCsv, pagesToCsv } from '@/pagesCsv'
import StatsPage from '@/components/Stats.vue'

export default {
  name: 'AppDetail',
  components: { CopyId, StatsPage },
  props: {
    id: { type: String, required: true }
  },
  emits: ['authenticated'],
  data () {
    return { app: null, pages: [], notFound: false, newPage: '', error: '', importing: false, importResult: '', maxPages: 0 }
  },
  computed: {
    full () { return isFull(this.pages.length, this.maxPages) },
    tabs () {
      return [{ key: 'stats', label: 'Statistiques' }, { key: 'config', label: 'Configuration' }]
    },
    // In the URL (?tab=config) so a reload or a shared link opens the same tab.
    // Without it: stats, or the configuration while the application has no page yet.
    tab () {
      const tab = this.$route.query.tab
      if (tab === 'stats' || tab === 'config') return tab
      return this.app && this.pages.length === 0 ? 'config' : 'stats'
    }
  },
  watch: {
    // The same component is reused when going from one application to another
    id () {
      Object.assign(this, { app: null, pages: [], notFound: false, newPage: '', error: '', importResult: '' })
      this.load()
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    setTab (tab) {
      this.$router.replace({ query: { ...this.$route.query, tab } })
    },
    // The default tab depends on whether there are pages: keep the configuration open while adding the first ones
    stayOnConfig () {
      if (!this.$route.query.tab) this.setTab('config')
    },
    load () {
      if (!this.maxPages) api.get('account').then(account => { this.maxPages = account.quotas.maxPagesPerApp }).catch(() => {})
      return api.get(`apps/${this.id}`)
        .then(json => { this.app = json.app; this.pages = json.pages; this.notFound = false })
        .catch(this.handleError)
    },
    async addPage () {
      const name = this.newPage.trim()
      if (!name) return
      this.error = ''
      this.stayOnConfig()
      try {
        await api.postJson(`apps/${this.id}/pages`, { name })
        this.newPage = ''
        await this.load()
      } catch (error) {
        this.handleError(error)
      }
    },
    async importCsv (event) {
      const file = event.target.files[0]
      event.target.value = ''
      if (!file) return
      this.error = ''
      this.importResult = ''
      let names
      try {
        names = pageNamesFromCsv(await file.text())
      } catch {
        this.error = 'Impossible de lire ce fichier.'
        return
      }
      if (names.length === 0) {
        this.error = 'Aucun nom de page trouvé : mettez un nom par ligne, dans la première colonne.'
        return
      }
      if (names.length > 1000) {
        this.error = `Le fichier contient ${names.length} pages : 1000 au maximum par import.`
        return
      }
      const known = new Set(this.pages.map(page => page.name))
      const added = new Set(names.filter(name => !known.has(name))).size
      if (this.maxPages && this.pages.length + added > this.maxPages) {
        this.error = `Ce fichier ajouterait ${added} pages : ${this.maxPages - this.pages.length} au plus, pour rester à ${this.maxPages} pages par application.`
        return
      }
      if (names.some(name => name.length > 255)) {
        this.error = 'Un nom de page dépasse 255 caractères.'
        return
      }
      this.importing = true
      this.stayOnConfig()
      try {
        const result = await api.postJson(`apps/${this.id}/pages/batch`, { names })
        const created = result.created.length
        const existing = result.existing.length
        this.importResult = `${created} page${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''}` +
          (existing ? `, ${existing} existai${existing > 1 ? 'ent' : 't'} déjà.` : '.')
        await this.load()
      } catch (error) {
        this.handleError(error)
      } finally {
        this.importing = false
      }
    },
    exportCsv () {
      const blob = new Blob(['\uFEFF' + pagesToCsv(this.app, this.pages)], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = csvFileName(this.app)
      link.click()
      // Revoked later: revoking right away can cancel the download in Firefox and Safari
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
    },
    async removePage (page) {
      if (!confirm(`Supprimer la page « ${page.name} » et toutes ses vues ? C'est définitif.`)) return
      this.error = ''
      try {
        await api.delete(`apps/${this.id}/pages/${page.id}`)
      } catch (error) {
        // Already gone: just refresh the list
        if (error.status !== 404) return this.handleError(error)
      }
      await this.load()
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
      else if (error.status === 404) { this.app = null; this.notFound = true }
      else this.error = quotaError(error) || 'Une erreur est survenue, réessayez.'
    }
  }
}
</script>

<style scoped>
.app-detail { max-width: 720px; margin: 0 auto; }
.tabs { display: inline-flex; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
.tabs button { border: 0; background: #fff; padding: 8px 20px; cursor: pointer; font: inherit; color: inherit; }
.tabs button + button { border-left: 1px solid #d1d5db; }
.tabs button.active { background: #2c3e50; color: #fff; }
.hint { color: #666; }
.create { margin: 12px 0; }
.create input { width: 60%; }
.csv button { margin: 0 4px; }
.pages { margin: 0 auto; border-collapse: collapse; }
.pages td { padding: 6px 10px; border-bottom: 1px solid #eee; text-align: left; }
.danger { color: #c0392b; }
.delete-app { margin-top: 40px; }
.error { color: #c0392b; }
</style>
