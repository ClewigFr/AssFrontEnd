<template>
  <div class="app-detail">
    <div class="page-head">
      <router-link
        :to="{ name: 'apps' }"
        class="back"
      >
        ← Mes applications
      </router-link>
      <div
        v-if="app"
        class="title-row"
      >
        <h1>
          {{ app.name }}
          <span
            v-if="shared"
            class="badge"
          >Partagée · {{ roleLabel }}</span>
        </h1>
        <div
          class="segmented"
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
      </div>
    </div>

    <template v-if="app">
      <p
        v-if="error"
        class="banner danger"
      >
        {{ error }}
      </p>

      <div
        v-if="tab === 'stats'"
        id="panel-stats"
        role="tabpanel"
        aria-labelledby="tab-stats"
      >
        <p
          v-if="pages.length === 0"
          class="banner"
        >
          Aucune page suivie pour l'instant<template v-if="canManage">
            : ajoutez-en dans l'onglet
            <a
              href="#"
              @click.prevent="setTab('config')"
            >Configuration</a>
          </template>.
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
        <section class="card">
          <h2>Identifiant de l'application</h2>
          <p class="hint">
            À passer à la librairie : <code>AssConfig(appId = …)</code>.
          </p>
          <CopyId :id="app.id" />
        </section>

        <section class="card">
          <div class="section-head">
            <h2>Pages suivies</h2>
            <span
              v-if="maxPages"
              class="hint"
            >{{ pages.length }} / {{ maxPages }} pages</span>
          </div>
          <form
            v-if="canManage"
            class="inline-form"
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
          <p
            v-if="canManage && full"
            class="hint"
          >
            Limite atteinte : supprimez une page pour en ajouter une autre.
          </p>
          <div class="csv">
            <input
              ref="csvFile"
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              hidden
              @change="importCsv"
            >
            <button
              v-if="canManage"
              type="button"
              class="secondary"
              :disabled="importing || full"
              title="Un nom de page par ligne, dans la première colonne"
              @click="$refs.csvFile.click()"
            >
              {{ importing ? 'Import…' : 'Importer un CSV' }}
            </button>
            <button
              type="button"
              class="secondary"
              :disabled="pages.length === 0"
              title="name, id, app_id : de quoi appeler logScreen pour chaque page"
              @click="exportCsv"
            >
              Exporter en CSV
            </button>
          </div>
          <p
            v-if="importResult"
            class="ok"
          >
            {{ importResult }}
          </p>
          <p
            v-if="pages.length === 0"
            class="hint"
          >
            Ajoutez une page, puis appelez <code>logScreen("&lt;UUID de la page&gt;")</code> quand elle s'affiche.
          </p>
          <div
            v-else
            class="table-wrap"
          >
            <table class="pages">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>UUID, pour <code>logScreen</code></th>
                  <th v-if="canManage" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="page in pages"
                  :key="page.id"
                >
                  <td class="page-name">
                    {{ page.name }}
                  </td>
                  <td><CopyId :id="page.id" /></td>
                  <td
                    v-if="canManage"
                    class="actions"
                  >
                    <button
                      type="button"
                      class="danger small"
                      @click="removePage(page)"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          v-if="canManage"
          class="card"
        >
          <h2>Supprimer des vues</h2>
          <p class="hint">
            Après un envoi de fausses vues par exemple : supprime toutes les vues reçues pendant la période, dans votre fuseau horaire. Les jours entiers déjà résumés (au-delà de la durée de conservation) sont supprimés aussi.
          </p>
          <form
            class="period"
            @submit.prevent="deleteViews"
          >
            <label>Du
              <input
                v-model="purge.from"
                type="datetime-local"
                name="purgeFrom"
                required
              >
            </label>
            <label>au
              <input
                v-model="purge.to"
                type="datetime-local"
                name="purgeTo"
                required
              >
            </label>
            <button
              type="submit"
              class="danger"
              :disabled="purging"
            >
              Supprimer les vues de cette période
            </button>
          </form>
          <p
            v-if="purgeResult"
            class="ok"
            role="status"
          >
            {{ purgeResult }}
          </p>
        </section>

        <section
          v-if="isOwner"
          class="card"
        >
          <h2>Partage</h2>
          <p class="hint">
            Donnez accès à un autre compte, par son email. Lecture : voir les statistiques. Gestion : aussi gérer les pages et supprimer des vues. Supprimer l'application et la partager restent réservés au propriétaire ; elle compte dans vos quotas.
          </p>
          <form
            class="inline-form"
            @submit.prevent="share"
          >
            <input
              v-model="newMember.email"
              type="email"
              name="memberEmail"
              placeholder="Email du compte"
              maxlength="128"
              required
            >
            <select
              v-model="newMember.role"
              name="memberRole"
              aria-label="Rôle"
            >
              <option value="read">
                Lecture
              </option>
              <option value="manage">
                Gestion
              </option>
            </select>
            <button
              type="submit"
              :disabled="!newMember.email.trim() || sharing"
            >
              Partager
            </button>
          </form>
          <p
            v-if="shareError"
            class="error"
            role="alert"
          >
            {{ shareError }}
          </p>
          <p
            v-if="members.length === 0"
            class="hint"
          >
            Cette application n'est partagée avec personne.
          </p>
          <ul
            v-else
            class="members"
          >
            <li
              v-for="member in members"
              :key="member.userId"
            >
              <span class="member-email">{{ member.email }}</span>
              <span class="badge">{{ ROLE_LABELS[member.role] }}</span>
              <button
                type="button"
                class="danger small"
                @click="unshare(member)"
              >
                Retirer
              </button>
            </li>
          </ul>
        </section>

        <section
          v-if="shared"
          class="card"
        >
          <h2>Accès partagé</h2>
          <p class="hint">
            {{ app.owner ? app.owner + ' partage' : 'Son propriétaire partage' }} cette application avec vous ({{ roleLabel }}).
          </p>
          <button
            type="button"
            class="secondary"
            @click="leave"
          >
            Quitter cette application
          </button>
        </section>

        <section
          v-if="isOwner"
          class="card danger-zone"
        >
          <h2>Zone de danger</h2>
          <p class="hint">
            Supprime l'application, ses pages et toutes leurs vues. C'est définitif.
          </p>
          <button
            type="button"
            class="danger"
            @click="removeApp"
          >
            Supprimer l'application
          </button>
        </section>
      </div>
    </template>
    <p
      v-else-if="notFound"
      class="banner"
    >
      Application introuvable.
    </p>
    <p
      v-else-if="error"
      class="banner danger"
    >
      {{ error }}
    </p>
  </div>
</template>

<script>
import { api } from '@/api'
import CopyId from '@/components/CopyId.vue'
import { lastHour, periodMs } from '@/period'
import { isFull, quotaError } from '@/quota'
import { csvFileName, pageNamesFromCsv, pagesToCsv } from '@/pagesCsv'
import StatsPage from '@/components/Stats.vue'
import { can, isShared, ROLE_LABELS, roleOf, shareError } from '@/roles'

export default {
  name: 'AppDetail',
  components: { CopyId, StatsPage },
  props: {
    id: { type: String, required: true }
  },
  emits: ['authenticated'],
  data () {
    return { app: null, pages: [], notFound: false, newPage: '', error: '', importing: false, importResult: '', maxPages: 0, purge: lastHour(), purging: false, purgeResult: '', members: [], newMember: { email: '', role: 'read' }, sharing: false, shareError: '' }
  },
  computed: {
    full () { return isFull(this.pages.length, this.maxPages) },
    canManage () { return can(this.app, 'manage') },
    isOwner () { return can(this.app, 'owner') },
    shared () { return isShared(this.app) },
    roleLabel () { return ROLE_LABELS[roleOf(this.app)] },
    ROLE_LABELS: () => ROLE_LABELS,
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
      Object.assign(this, { app: null, pages: [], notFound: false, newPage: '', error: '', importResult: '', purgeResult: '', members: [], shareError: '' })
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
      return api.get(`apps/${encodeURIComponent(this.id)}`)
        .then(json => {
          this.app = json.app
          this.pages = json.pages
          this.notFound = false
          // GET /apps/{id} has no owner email: GET /apps does, for the shared ones
          if (this.shared) this.loadOwner()
          if (this.isOwner) return this.loadMembers()
        })
        .catch(this.handleError)
    },
    loadOwner () {
      return api.get('apps')
        .then(json => {
          const found = json.apps.find(app => app.id === this.id)
          if (found && this.app) this.app = { ...this.app, owner: found.owner }
        })
        .catch(() => {})
    },
    loadMembers () {
      return api.get(`apps/${encodeURIComponent(this.id)}/members`)
        .then(json => { this.members = json.members })
        .catch(this.handleError)
    },
    async share () {
      const email = this.newMember.email.trim()
      if (!email) return
      this.shareError = ''
      this.sharing = true
      try {
        const json = await api.postJson(`apps/${encodeURIComponent(this.id)}/members`, { email, role: this.newMember.role })
        this.members = json.members
        this.newMember = { email: '', role: 'read' }
      } catch (error) {
        const message = shareError(error)
        if (message) this.shareError = message
        else this.handleError(error)
      } finally {
        this.sharing = false
      }
    },
    async unshare (member) {
      if (!confirm(`Retirer l'accès de ${member.email} à « ${this.app.name} » ?`)) return
      this.shareError = ''
      try {
        await api.delete(`apps/${encodeURIComponent(this.id)}/members/${member.userId}`)
      } catch (error) {
        if (error.status !== 404) return this.handleError(error)
      }
      await this.loadMembers()
    },
    async leave () {
      if (!confirm(`Quitter « ${this.app.name} » ? Vous n'y aurez plus accès.`)) return
      try {
        await api.delete(`apps/${encodeURIComponent(this.id)}/members/me`)
        this.$router.push({ name: 'apps' })
      } catch (error) {
        this.handleError(error)
      }
    },
    async addPage () {
      const name = this.newPage.trim()
      if (!name) return
      this.error = ''
      this.stayOnConfig()
      try {
        await api.postJson(`apps/${encodeURIComponent(this.id)}/pages`, { name })
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
        const result = await api.postJson(`apps/${encodeURIComponent(this.id)}/pages/batch`, { names })
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
    async deleteViews () {
      this.error = ''
      this.purgeResult = ''
      const period = periodMs(this.purge.from, this.purge.to)
      if (!period) {
        this.error = 'La fin de la période doit être après son début.'
        return
      }
      const label = `du ${new Date(period.from).toLocaleString('fr-FR')} au ${new Date(period.to).toLocaleString('fr-FR')}`
      if (!confirm(`Supprimer toutes les vues de « ${this.app.name} » reçues ${label} ? C'est définitif.`)) return
      this.purging = true
      try {
        const { deleted } = await api.delete(`apps/${encodeURIComponent(this.id)}/views?from=${period.from}&to=${period.to}`)
        this.purgeResult = `${deleted} vue${deleted > 1 ? 's' : ''} supprimée${deleted > 1 ? 's' : ''}.`
      } catch (error) {
        this.handleError(error)
      } finally {
        this.purging = false
      }
    },
    async removePage (page) {
      if (!confirm(`Supprimer la page « ${page.name} » et toutes ses vues ? C'est définitif.`)) return
      this.error = ''
      try {
        await api.delete(`apps/${encodeURIComponent(this.id)}/pages/${page.id}`)
      } catch (error) {
        // Already gone: just refresh the list
        if (error.status !== 404) return this.handleError(error)
      }
      await this.load()
    },
    async removeApp () {
      if (!confirm(`Supprimer l'application « ${this.app.name} », ses pages et toutes ses vues ? C'est définitif.`)) return
      try {
        await api.delete(`apps/${encodeURIComponent(this.id)}`)
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
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.csv { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pages th code { text-transform: none; letter-spacing: 0; }
.page-name { font-weight: 600; }
.actions { text-align: right; }
.badge { display: inline-block; vertical-align: middle; font-size: 0.8rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); }
.members { list-style: none; padding: 0; margin: 0; }
.members li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.members li:last-child { border-bottom: 0; }
.member-email { flex: 1; overflow-wrap: anywhere; }
.danger-zone { border-color: var(--danger-soft); }
.period { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 12px; }
.period label { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; color: var(--muted); }
/* Phones: one block per page (name and delete button, then the UUID) */
@media (max-width: 600px) {
  .pages thead { display: none; }
  .pages tr { display: grid; grid-template-columns: 1fr auto; gap: 6px 8px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .pages tbody tr:last-child { border-bottom: 0; }
  .pages td { border: 0; padding: 0; }
  .pages td:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
}
</style>
