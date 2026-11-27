<template>
  <div class="auth-card card">
    <div class="brand">
      <AssLogo />
      Anonymous Simple Stats
    </div>
    <h1>Page introuvable</h1>
    <p class="hint">
      Cette adresse ne correspond à aucune page. Le lien est peut-être incomplet ou ancien.
    </p>
    <router-link
      :to="{ name: 'home' }"
      class="button-link"
    >
      Retour à l'accueil
    </router-link>
  </div>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'

// Shown for unknown paths. nginx already answers them with a 404 status (see nginx.conf);
// the noindex covers the case where a crawler lands here through the app's own navigation.
export default {
  name: 'NotFound',
  components: { AssLogo },
  mounted () {
    this.robots = document.createElement('meta')
    this.robots.name = 'robots'
    this.robots.content = 'noindex'
    document.head.appendChild(this.robots)
  },
  unmounted () {
    this.robots?.remove()
  }
}
</script>
