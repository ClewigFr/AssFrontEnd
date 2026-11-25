<template>
  <article class="legal">
    <router-link
      :to="{ name: 'home' }"
      class="back"
    >
      ← Anonymous Simple Stats
    </router-link>

    <p
      v-if="loading"
      class="hint"
    >
      Chargement…
    </p>
    <!-- Written by the operator of this instance (public/legal/, see src/legal.js), never by users -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-else-if="html"
      class="content"
      v-html="html"
    />
    <!-- eslint-enable vue/no-v-html -->
    <template v-else>
      <h1>Page indisponible</h1>
      <p>Cette instance ne publie pas cette page.</p>
    </template>

    <nav
      v-if="pages.length"
      class="legal-links"
    >
      <router-link
        v-for="link in links"
        :key="link.name"
        :to="{ name: link.name }"
      >
        {{ link.label }}
      </router-link>
    </nav>
  </article>
</template>

<script>
import { api } from '@/api'
import { formatCount } from '@/quota'
import { legal, loadLegalPage } from '@/legal'

const LABELS = { legal: 'Mentions légales', privacy: 'Confidentialité', terms: "Conditions d'utilisation" }

export function retentionText (limits) {
  const days = limits?.retentionDays
  if (days === 0) return 'sans limite de durée'
  return `${days || 90} jours`
}

export function limitsText (limits) {
  if (!limits) return 'un nombre limité d\'applications, de pages et de vues par mois, indiqué sur la page d\'accueil'
  const n = (value, unit) => value > 0 ? `${formatCount(value)} ${unit}` : `des ${unit} sans limite`
  return `${n(limits.maxApps, 'applications')}, ${n(limits.maxPagesPerApp, 'pages par application')} et ${n(limits.maxMonthlyViews, 'vues par mois')}`
}

export default {
  name: 'LegalPage',
  props: {
    page: { type: String, required: true }
  },
  data () {
    return { html: null, loading: true }
  },
  computed: {
    pages () { return legal.pages },
    links () { return this.pages.map(name => ({ name, label: LABELS[name] })) }
  },
  watch: {
    page () { this.load() }
  },
  mounted () { this.load() },
  methods: {
    async load () {
      this.loading = true
      const limits = await api.get('limits').catch(() => null)
      this.html = await loadLegalPage(this.page, { retention: retentionText(limits), limits: limitsText(limits) })
      this.loading = false
    }
  }
}
</script>

<style scoped>
.legal { max-width: 720px; margin: 0 auto; }
.back { display: inline-block; margin-bottom: 16px; font-size: 0.9rem; }
.content :deep(h2) { margin-top: 28px; }
.content :deep(ul) { padding-left: 20px; }
.content :deep(li) { margin-bottom: 6px; }
.content :deep(table) { margin: 8px 0 16px; font-size: 0.92rem; }
.legal-links { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 0.9rem; }
.legal-links .router-link-exact-active { color: var(--text); font-weight: 600; }
</style>
