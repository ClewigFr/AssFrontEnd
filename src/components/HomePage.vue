<template>
  <div class="home">
    <header class="home-nav">
      <span class="brand">
        <AssLogo :size="32" />
        Anonymous Simple Stats
      </span>
      <nav>
        <router-link
          v-if="logged"
          :to="{ name: 'apps' }"
          class="button-link"
        >
          Ouvrir le dashboard
        </router-link>
        <template v-else>
          <router-link :to="{ name: 'login' }">
            Se connecter
          </router-link>
          <router-link
            :to="{ name: 'register' }"
            class="button-link"
          >
            Créer un compte
          </router-link>
        </template>
      </nav>
    </header>

    <section class="hero">
      <AssLogo :size="88" />
      <h1>Des statistiques d'écrans pour Android, anonymes par conception.</h1>
      <p class="lead">
        Une petite librairie pour savoir quels écrans de votre app sont vus, combien de temps durent les sessions et d'où partent vos utilisateurs. Sans jamais savoir qui ils sont.
      </p>
      <div class="cta">
        <router-link
          :to="{ name: logged ? 'apps' : 'register' }"
          class="button-link big"
        >
          {{ logged ? 'Ouvrir le dashboard' : 'Commencer gratuitement' }}
        </router-link>
        <a
          href="#integration"
          class="secondary-link"
          @click.prevent="scrollTo('integration')"
        >Voir l'intégration</a>
      </div>
    </section>

    <section class="features">
      <article class="card">
        <h2>Ce que fait la librairie</h2>
        <ul>
          <li>Elle compte les vues de chaque écran que vous déclarez, un appel <code>logScreen</code> par écran.</li>
          <li>Le dashboard montre les vues, les sessions, les pages par session, la durée moyenne et le taux de rebond, par jour, semaine, mois ou année.</li>
          <li>Les vues partent par lots, en arrière-plan. Hors ligne, elles sont gardées et renvoyées plus tard.</li>
          <li>Aucune dépendance en dehors de Kotlin, une seule permission (<code>INTERNET</code>), Android 4.1 et plus.</li>
        </ul>
      </article>

      <article class="card">
        <h2>Anonyme, vraiment</h2>
        <ul>
          <li>Aucun identifiant d'appareil, de publicité ou d'utilisateur. Pas de cookie, pas d'empreinte.</li>
          <li>Une session, c'est un identifiant tiré au hasard à chaque lancement de l'app : impossible de relier deux lancements.</li>
          <li>Les adresses IP ne sont jamais enregistrées. Elles ne servent qu'à limiter les abus, en mémoire.</li>
          <li v-if="limits?.retentionDays">
            Après {{ limits.retentionDays }} jours, le détail des sessions est effacé : il ne reste que le nombre de vues par page et par jour.
          </li>
        </ul>
        <p class="hint">
          Rien de ce qui est collecté ne permet d'identifier une personne ou de la suivre d'un lancement à l'autre.
        </p>
      </article>
    </section>

    <section
      id="integration"
      class="card integration"
    >
      <h2>L'intégrer en quatre étapes</h2>
      <ol class="steps">
        <li>
          <h3>Créez votre application</h3>
          <p>Dans le dashboard, créez une application et ajoutez une page par écran à suivre, à la main ou en important un CSV. Chacune reçoit son identifiant.</p>
        </li>
        <li>
          <h3>Ajoutez la dépendance</h3>
          <pre><code>// settings.gradle
repositories { maven { url 'https://jitpack.io' } }

// app/build.gradle
implementation 'com.github.ClewigFr:AssAndroid:{{ version }}'</code></pre>
        </li>
        <li>
          <h3>Initialisez-la une fois</h3>
          <pre><code>class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AnonymousSimpleStatsManager.getInstance(this, AssConfig(
            endpoint = "https://ass-api.clewig.fr",
            appId = "&lt;UUID de l'application&gt;"
        ))
    }
}</code></pre>
        </li>
        <li>
          <h3>Comptez chaque écran</h3>
          <pre><code>override fun onResume() {
    super.onResume()
    AnonymousSimpleStatsManager.getInstance(this, config)
        .logScreen("&lt;UUID de la page&gt;")
}</code></pre>
          <p class="hint">
            Les vues apparaissent dans le dashboard quelques secondes après leur envoi.
          </p>
        </li>
      </ol>
      <p class="ai">
        Beaucoup d'écrans ? Le guide <a
          href="https://github.com/ClewigFr/AssAndroid/blob/master/AI_INTEGRATION.md"
          target="_blank"
          rel="noopener"
        >AI_INTEGRATION.md</a> permet à un assistant IA de lister les écrans de votre app, puis d'ajouter tous les appels à partir de l'export CSV du dashboard.
      </p>
    </section>

    <!-- The server's own settings (GET /limits): hidden when they can't be read -->
    <section
      v-if="limits"
      class="card limits"
    >
      <h2>Gratuit, dans ces limites</h2>
      <div class="limit-grid">
        <div><strong>{{ count(limits.maxApps) }}</strong> applications</div>
        <div><strong>{{ count(limits.maxPagesPerApp) }}</strong> pages par application</div>
        <div><strong>{{ count(limits.maxMonthlyViews) }}</strong> vues par mois</div>
      </div>
      <p
        v-if="limits.maxMonthlyViews"
        class="hint"
      >
        Au-delà de {{ count(limits.maxMonthlyViews) }} vues, le dashboard affiche une alerte, mais les vues continuent d'être comptées.
      </p>
    </section>

    <footer class="home-footer">
      <a
        href="https://github.com/ClewigFr/AssAndroid"
        target="_blank"
        rel="noopener"
      >Code source de la librairie (MIT)</a>
      <span class="footer-links">
        <router-link :to="{ name: 'legal' }">Mentions légales</router-link>
        <router-link :to="{ name: 'privacy' }">Confidentialité</router-link>
        <router-link :to="{ name: 'terms' }">Conditions</router-link>
      </span>
    </footer>
  </div>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api } from '@/api'
import { formatCount } from '@/quota'

export default {
  name: 'HomePage',
  components: { AssLogo },
  data () {
    // Shown in the Gradle snippet; keep in step with the library's latest tag
    return { logged: false, version: '0.4.0', limits: null }
  },
  mounted () {
    // Only changes the buttons: the page itself is public
    api.get('login').then(body => { this.logged = body === 'Logged' }).catch(() => {})
    api.get('limits').then(limits => { this.limits = limits }).catch(() => {})
  },
  methods: {
    // 0 means no limit
    count (n) { return n > 0 ? formatCount(n) : 'Illimité' },
    scrollTo (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
</script>

<style scoped>
.home { max-width: 920px; margin: 0 auto; }
.home-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 40px; }
.home-nav .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.home-nav nav { display: flex; align-items: center; gap: 16px; }
.button-link {
  display: inline-block;
  background: var(--primary);
  color: var(--on-primary);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}
.button-link:hover { background: var(--primary-hover); text-decoration: none; }
.button-link.big { padding: 12px 22px; font-size: 1.05rem; }
.hero { text-align: center; padding: 16px 0 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.hero h1 { font-size: clamp(1.7rem, 4vw, 2.4rem); max-width: 720px; margin: 8px 0 0; }
.lead { font-size: 1.1rem; color: var(--muted); max-width: 640px; margin: 0; }
.cta { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.secondary-link { font-weight: 600; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 16px; }
.features > *, .integration { min-width: 0; }
.features ul { padding-left: 20px; margin: 0 0 12px; }
.features li { margin-bottom: 8px; }
.integration h3 { font-size: 1rem; margin: 0 0 6px; }
.steps { list-style: none; padding: 0; margin: 0; counter-reset: step; display: grid; gap: 20px; }
.steps li { counter-increment: step; position: relative; padding-left: 44px; min-width: 0; }
.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  display: grid;
  place-items: center;
}
pre {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
}
pre code { font-size: inherit; }
.ai { margin: 24px 0 0; padding-top: 16px; border-top: 1px solid var(--border); }
.limit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 12px; }
.limit-grid div { background: var(--surface-2); border-radius: var(--radius-sm); padding: 14px; color: var(--muted); }
.limit-grid strong { display: block; font-size: 1.6rem; color: var(--text); }
.footer-links { display: flex; gap: 14px; flex-wrap: wrap; }
.home-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 0.9rem; padding: 24px 0 8px; }
@media (max-width: 520px) {
  .home-nav { margin-bottom: 24px; }
  .steps li { padding-left: 0; padding-top: 38px; }
  .home-nav .brand { font-size: 0; gap: 0; }
}
</style>
