<template>
  <div class="home">
    <header class="home-nav">
      <span class="brand">
        <AssLogo :size="32" />
        Anonymous Simple Stats
      </span>
      <nav>
        <a
          href="https://github.com/ClewigFr"
          target="_blank"
          rel="noopener"
          class="nav-github"
        >GitHub</a>
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
      <h1>Des statistiques d'écrans pour Android et iOS, anonymes par conception.</h1>
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
      <ul
        class="badges"
        aria-label="En bref"
      >
        <li>Aucun identifiant d'appareil</li>
        <li>Aucune dépendance</li>
        <li>Open source, licence MIT</li>
        <li>Quelques lignes à intégrer</li>
      </ul>
    </section>

    <!-- Screenshots of the real dashboard, filled by a demo app with generated views (never real data) -->
    <section
      class="showcase"
      aria-labelledby="showcase-title"
    >
      <h2 id="showcase-title">
        Le dashboard que vous aurez
      </h2>
      <p class="hint showcase-hint">
        Captures du vrai dashboard, avec une application de démonstration et des vues générées.
      </p>
      <figure class="shot main-shot">
        <picture>
          <source
            srcset="/screenshots/overview-dark.png"
            media="(prefers-color-scheme: dark)"
          >
          <img
            src="/screenshots/overview-light.png"
            width="1904"
            height="1074"
            alt="Vue d'ensemble : pages vues, sessions, pages par session, durée moyenne et taux de rebond sur un mois, avec la courbe d'activité jour par jour comparée à la période précédente."
          >
        </picture>
        <figcaption>Vues, sessions, durée moyenne et rebond, par jour, semaine, mois ou année, comparés à la période précédente.</figcaption>
      </figure>
      <div class="shot-grid">
        <figure class="shot">
          <picture>
            <source
              srcset="/screenshots/pages-dark.png"
              media="(prefers-color-scheme: dark)"
            >
            <img
              src="/screenshots/pages-light.png"
              width="1856"
              height="606"
              loading="lazy"
              alt="Répartition des vues par page en camembert : Accueil 35 %, Recette 32 %, Recherche 11 %…"
            >
          </picture>
          <figcaption>Les écrans les plus vus, en tableau ou en camembert, exportables en CSV.</figcaption>
        </figure>
        <figure class="shot">
          <picture>
            <source
              srcset="/screenshots/flows-dark.png"
              media="(prefers-color-scheme: dark)"
            >
            <img
              src="/screenshots/flows-light.png"
              width="1856"
              height="860"
              loading="lazy"
              alt="Parcours : les enchaînements d'écrans les plus fréquents, avec le nombre de sessions et le temps moyen passé avant de changer d'écran."
            >
          </picture>
          <figcaption>Les parcours : d'où viennent vos utilisateurs et où ils vont ensuite.</figcaption>
        </figure>
      </div>
    </section>

    <section class="features">
      <article class="card">
        <h2>Ce que fait la librairie</h2>
        <ul>
          <li>Elle compte les vues de chaque écran que vous déclarez, un appel <code>logScreen</code> par écran.</li>
          <li>Le dashboard montre les vues, les sessions, les pages par session, la durée moyenne et le taux de rebond, par jour, semaine, mois ou année.</li>
          <li>Les vues partent par lots, en arrière-plan. Hors ligne, elles sont gardées et renvoyées plus tard.</li>
          <li>Android : aucune dépendance en dehors de Kotlin, une seule permission (<code>INTERNET</code>), Android 4.1 et plus.</li>
          <li>iOS : un Swift package sans dépendance, iOS 15 et plus, avec son manifeste de confidentialité.</li>
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
      class="card compare"
      aria-labelledby="compare-title"
    >
      <h2 id="compare-title">
        Par rapport à une solution d'analytics classique
      </h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">
                Anonymous Simple Stats
              </th>
              <th scope="col">
                Analytics classique
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                Identifiant d'appareil ou de publicité
              </th>
              <td>Jamais</td>
              <td>Souvent</td>
            </tr>
            <tr>
              <th scope="row">
                Suivi d'un lancement à l'autre
              </th>
              <td>Impossible</td>
              <td>Oui</td>
            </tr>
            <tr>
              <th scope="row">
                Dépendances ajoutées à l'app
              </th>
              <td>Aucune</td>
              <td>Un SDK et ses dépendances</td>
            </tr>
            <tr>
              <th scope="row">
                Code source
              </th>
              <td>Ouvert (MIT), auto-hébergeable</td>
              <td>Fermé le plus souvent</td>
            </tr>
            <tr>
              <th scope="row">
                Ce que vous mesurez
              </th>
              <td>Les écrans, les sessions, les parcours</td>
              <td>Bien plus, avec bien plus de données</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      id="integration"
      class="card integration"
    >
      <h2>L'intégrer en quatre étapes</h2>
      <div
        class="platforms"
        role="tablist"
        aria-label="Plateforme"
      >
        <button
          v-for="p in platforms"
          :key="p.id"
          type="button"
          role="tab"
          :aria-selected="platform === p.id"
          :class="{ active: platform === p.id }"
          @click="platform = p.id"
        >
          {{ p.label }}
        </button>
      </div>
      <ol class="steps">
        <li>
          <h3>Créez votre application</h3>
          <p>Dans le dashboard, créez une application et ajoutez une page par écran à suivre, à la main ou en important un CSV. Chacune reçoit son identifiant.</p>
        </li>
        <li v-if="platform === 'ios'">
          <h3>Ajoutez le package</h3>
          <pre><code>// Xcode : File › Add Package Dependencies…
https://github.com/ClewigFr/AssIOS  // à partir de {{ version }}</code></pre>
          <p class="hint">
            Avec SwiftUI, <code>.trackScreen</code> compte l'écran à chaque affichage et à chaque retour au premier plan.
          </p>
        </li>
        <li v-else>
          <h3>Ajoutez la dépendance</h3>
          <pre><code>// settings.gradle
repositories { maven { url 'https://jitpack.io' } }

// app/build.gradle
implementation 'com.github.ClewigFr.AssAndroid:assLib:{{ version }}'</code></pre>
          <p class="hint">
            Avec Jetpack Compose, utilisez plutôt <code>assCompose</code> : il inclut la librairie et ajoute <code>TrackScreen</code>.
          </p>
        </li>
        <li v-if="platform === 'ios'">
          <h3>Initialisez-le une fois</h3>
          <pre><code>import AnonymousSimpleStats

let stats = AnonymousSimpleStatsManager.getInstance(AssConfig(
    endpoint: "{{ endpoint }}",
    appId: "&lt;UUID de l'application&gt;"
))</code></pre>
        </li>
        <li v-else>
          <h3>Initialisez-la une fois</h3>
          <pre><code>class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AnonymousSimpleStatsManager.getInstance(this, AssConfig(
            endpoint = "{{ endpoint }}",
            appId = "&lt;UUID de l'application&gt;"
        ))
    }
}</code></pre>
        </li>
        <li>
          <h3>Comptez chaque écran</h3>
          <pre v-if="platform === 'ios'"><code>// SwiftUI
var body: some View {
    CartContent()
        .trackScreen(stats, "&lt;UUID de la page&gt;")
}

// UIKit
override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    stats.logScreen("&lt;UUID de la page&gt;")
}</code></pre>
          <pre v-else><code>override fun onResume() {
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
          :href="`${repo}/blob/master/AI_INTEGRATION.md`"
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

    <section
      class="card faq"
      aria-labelledby="faq-title"
    >
      <h2 id="faq-title">
        Questions fréquentes
      </h2>
      <details>
        <summary>Qu'est-ce qui est envoyé, exactement ?</summary>
        <p>Pour chaque vue : l'identifiant de la page, un identifiant de session tiré au hasard au lancement de l'app, et le temps écoulé depuis la vue. Rien d'autre : ni modèle d'appareil, ni langue, ni position.</p>
      </details>
      <details>
        <summary>Combien de temps prend l'intégration ?</summary>
        <p>Quelques minutes : une dépendance, une initialisation, puis un appel par écran. Avec beaucoup d'écrans, le guide AI_INTEGRATION.md permet à un assistant IA d'ajouter tous les appels.</p>
      </details>
      <details>
        <summary>Et si l'appareil est hors ligne ?</summary>
        <p>Les vues sont gardées sur l'appareil et renvoyées plus tard, par lots, sans jamais être envoyées deux fois.</p>
      </details>
      <details>
        <summary>Puis-je héberger le service moi-même ?</summary>
        <p>
          Oui : les librairies, l'API et ce dashboard sont open source, sous licence MIT. Le code est sur <a
            href="https://github.com/ClewigFr"
            target="_blank"
            rel="noopener"
          >GitHub</a>.
        </p>
      </details>
      <details>
        <summary>Que se passe-t-il si je dépasse les limites gratuites ?</summary>
        <p>Le dashboard affiche une alerte, mais les vues continuent d'être comptées : rien n'est perdu.</p>
      </details>
    </section>

    <section
      v-if="!logged"
      class="final-cta"
    >
      <h2>Prêt à savoir quels écrans comptent ?</h2>
      <p>Un compte gratuit, une application, quelques lignes de code : vos premières vues arrivent dans la minute.</p>
      <div class="cta">
        <router-link
          :to="{ name: 'register' }"
          class="button-link big"
        >
          Créer un compte gratuit
        </router-link>
        <a
          href="https://github.com/ClewigFr"
          target="_blank"
          rel="noopener"
          class="secondary-link"
        >Lire le code sur GitHub</a>
      </div>
    </section>

    <footer class="home-footer">
      <span>
        Code source (MIT) :
        <a
          href="https://github.com/ClewigFr/AssAndroid"
          target="_blank"
          rel="noopener"
        >Android</a>,
        <a
          href="https://github.com/ClewigFr/AssIOS"
          target="_blank"
          rel="noopener"
        >iOS</a>,
        <a
          href="https://github.com/ClewigFr/AssBackend"
          target="_blank"
          rel="noopener"
        >API</a>,
        <a
          href="https://github.com/ClewigFr/AssFrontEnd"
          target="_blank"
          rel="noopener"
        >dashboard</a>
      </span>
      <span class="footer-links">
        <router-link
          v-if="legal.pages.includes('legal')"
          :to="{ name: 'legal' }"
        >Mentions légales</router-link>
        <router-link
          v-if="legal.pages.includes('privacy')"
          :to="{ name: 'privacy' }"
        >Confidentialité</router-link>
        <router-link
          v-if="legal.pages.includes('terms')"
          :to="{ name: 'terms' }"
        >Conditions</router-link>
      </span>
    </footer>
  </div>
</template>

<script>
import AssLogo from '@/components/AssLogo.vue'
import { api, BACKEND_URL } from '@/api'
import { formatCount } from '@/quota'
import { legal } from '@/legal'

export default {
  name: 'HomePage',
  components: { AssLogo },
  // From App's session check (false when mounted alone, as in the tests)
  inject: { logged: { default: false } },
  data () {
    return {
      // Shown in the Gradle and Swift package snippets: the latest release of each library, from the
      // backend's GET /versions; these are only used until it answers, or if it doesn't know them
      versions: { android: '0.5.1', ios: '0.5.0' },
      limits: null,
      platform: 'android',
      platforms: [{ id: 'android', label: 'Android' }, { id: 'ios', label: 'iOS' }],
      legal,
      // The API of this instance, for the AssConfig snippets
      endpoint: BACKEND_URL
    }
  },
  computed: {
    version () {
      return this.versions[this.platform]
    },
    repo () {
      return this.platform === 'ios' ? 'https://github.com/ClewigFr/AssIOS' : 'https://github.com/ClewigFr/AssAndroid'
    }
  },
  mounted () {
    // Only changes the buttons: the page itself is public
    api.get('limits').then(limits => { this.limits = limits }).catch(() => {})
    api.get('versions').then(latest => {
      for (const p of ['android', 'ios']) if (latest?.[p]) this.versions[p] = latest[p]
    }).catch(() => {})
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
.platforms { display: inline-flex; gap: 4px; padding: 4px; margin-bottom: 20px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.platforms button { background: transparent; color: var(--muted); border: 0; padding: 6px 16px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; }
.platforms button.active { background: var(--primary); color: var(--on-primary); }
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
.badges { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.badges li { background: var(--primary-soft); color: var(--primary); border-radius: 999px; padding: 4px 12px; font-size: 0.9rem; font-weight: 600; }
.badges li::before { content: "✓ "; }
.showcase { margin-bottom: 32px; }
.showcase h2 { text-align: center; font-size: 1.6rem; margin: 0 0 4px; }
.showcase-hint { text-align: center; margin: 0 0 20px; }
.shot { margin: 0; min-width: 0; }
.shot img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: 0 12px 32px rgb(16 24 40 / 12%), var(--shadow);
  background: var(--bg);
}
.shot figcaption { color: var(--muted); font-size: 0.92rem; margin-top: 10px; text-align: center; }
.main-shot { margin-bottom: 24px; }
.shot-grid { display: grid; gap: 24px; }
.final-cta { text-align: center; padding: 40px 16px; margin-top: 16px; border-radius: var(--radius); background: var(--primary-soft); }
.final-cta h2 { margin: 0 0 8px; font-size: 1.5rem; }
.final-cta p { margin: 0 auto 16px; max-width: 560px; color: var(--muted); }
.compare, .faq { margin-top: 16px; min-width: 0; }
.table-wrap { overflow-x: auto; }
.compare table { width: 100%; border-collapse: collapse; }
.compare th, .compare td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.compare tbody th { font-weight: 600; text-transform: none; letter-spacing: normal; font-size: inherit; color: var(--text); }
.compare table { font-size: 0.95rem; }
.compare thead th:nth-child(2), .compare td:nth-child(2) { color: var(--primary); font-weight: 600; }
.compare td:nth-child(3) { color: var(--muted); }
.faq details { border-bottom: 1px solid var(--border); padding: 12px 0; }
.faq details:last-child { border-bottom: 0; }
.faq summary { cursor: pointer; font-weight: 600; }
.faq details p { margin: 8px 0 0; color: var(--muted); }
@media (max-width: 520px) {
  .nav-github { display: none; }
  .compare table { font-size: 0.85rem; }
  .compare th, .compare td { padding: 8px 6px; }
  .compare thead th { font-size: 0.7rem; }
  .home-nav { margin-bottom: 24px; }
  .steps li { padding-left: 0; padding-top: 38px; }
  .home-nav .brand { font-size: 0; gap: 0; }
}
</style>
