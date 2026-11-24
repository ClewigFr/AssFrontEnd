<template>
  <article class="legal">
    <router-link
      :to="{ name: 'home' }"
      class="back"
    >
      ← Anonymous Simple Stats
    </router-link>

    <template v-if="page === 'legal'">
      <h1>Mentions légales</h1>
      <p class="hint">
        Dernière mise à jour : 24 novembre 2026
      </p>

      <h2>Éditeur</h2>
      <p>
        Anonymous Simple Stats est édité par Clewig SARL, SIRET 853 948 180 00015,
        46 rue Maurice Hay, 35200 Rennes, France.<br>
        Directeur de la publication : Walig Lussot.<br>
        Contact : <a href="mailto:contact@clewig.fr">contact@clewig.fr</a>.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le service (API, dashboard et base de données) est hébergé par l'éditeur, Clewig SARL, sur son propre serveur (adresse ci-dessus).
        Il est publié sur Internet par Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La librairie Android est distribuée sous licence MIT. Le nom, le logo et le contenu de ce site appartiennent à l'éditeur.
      </p>
    </template>

    <template v-else-if="page === 'privacy'">
      <h1>Politique de confidentialité</h1>
      <p class="hint">
        Dernière mise à jour : 24 novembre 2026
      </p>

      <p>
        Anonymous Simple Stats est conçu pour collecter le moins de données possible. Cette page distingue deux choses :
        les statistiques envoyées par les applications, qui sont anonymes, et les comptes du dashboard, qui contiennent quelques données personnelles.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        Clewig SARL, 46 rue Maurice Hay, 35200 Rennes, joignable à <a href="mailto:contact@clewig.fr">contact@clewig.fr</a>.
      </p>

      <h2>Les statistiques des applications</h2>
      <p>
        La librairie envoie, pour chaque écran affiché : l'identifiant de l'écran (choisi par le développeur),
        un identifiant de session tiré au hasard à chaque lancement de l'application, et le moment de l'affichage.
        Elle n'envoie aucun identifiant d'appareil, de publicité ou d'utilisateur, et ne dépose pas de cookie.
        Deux lancements ne peuvent pas être reliés entre eux.
      </p>
      <ul>
        <li>L'adresse IP de l'appareil sert seulement, en mémoire, à limiter les abus. Elle n'est jamais enregistrée par le service.</li>
        <li>Le détail des vues est conservé {{ retentionText }}, puis remplacé par le nombre de vues par écran et par jour.</li>
      </ul>
      <p>
        Le développeur qui intègre la librairie reste responsable de l'information des utilisateurs de son application.
      </p>

      <h2>Les comptes du dashboard</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Pourquoi</th>
              <th>Combien de temps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Adresse email</td>
              <td>Connexion, vérification du compte, réinitialisation du mot de passe, messages sur le compte</td>
              <td>Tant que le compte existe. Un compte jamais vérifié est supprimé au bout d'un jour</td>
            </tr>
            <tr>
              <td>Nom (facultatif)</td>
              <td>Affichage dans le dashboard</td>
              <td>Tant que le compte existe</td>
            </tr>
            <tr>
              <td>Mot de passe</td>
              <td>Connexion. Il est stocké haché (bcrypt), jamais en clair</td>
              <td>Tant que le compte existe</td>
            </tr>
            <tr>
              <td>Cookie de session</td>
              <td>Rester connecté. C'est le seul cookie, indispensable au service</td>
              <td>7 jours au plus</td>
            </tr>
            <tr>
              <td>Applications, pages et leurs statistiques</td>
              <td>Le service lui-même</td>
              <td>Tant que le compte existe</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        La base est sauvegardée chaque nuit, chiffrée avant de quitter le serveur. Une donnée supprimée peut rester
        dans ces sauvegardes chiffrées jusqu'à 6 mois, le temps qu'elles expirent.
      </p>

      <h2>Sous-traitants</h2>
      <ul>
        <li><strong>Cloudflare, Inc.</strong> (États-Unis) : publication du site et de l'API, et vérification anti-robot à l'inscription (Turnstile). Cloudflare voit passer les adresses IP des visiteurs.</li>
        <li><strong>Backblaze, Inc.</strong> (États-Unis) : stockage des sauvegardes, chiffrées avant l'envoi, dans un centre de données de l'Union européenne (région EU Central).</li>
        <li><strong>OVH SAS</strong> (France) : envoi des emails du service.</li>
      </ul>
      <p>
        Cloudflare et Backblaze sont des sociétés américaines. Les éventuels transferts de données hors de l'Union européenne s'appuient sur les garanties qu'elles proposent : le Data Privacy Framework UE–États-Unis et les clauses contractuelles types de la Commission européenne.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez consulter et corriger vos données, et supprimer votre compte avec tout son contenu, depuis la page
        <router-link :to="{ name: 'account' }">
          Mon compte
        </router-link>.
        Pour toute autre demande (accès, opposition, portabilité), écrivez à <a href="mailto:contact@clewig.fr">contact@clewig.fr</a>.
        Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </template>

    <template v-else>
      <h1>Conditions d'utilisation</h1>
      <p class="hint">
        Dernière mise à jour : 24 novembre 2026
      </p>

      <h2>Le service</h2>
      <p>
        Anonymous Simple Stats compte les écrans vus dans des applications Android et les présente dans un dashboard.
        Il est fourni gratuitement, tel quel, sans garantie de disponibilité ni de conservation des données.
      </p>

      <h2>Limites</h2>
      <p>
        Chaque compte peut créer {{ limitsText }}. Au-delà du quota de vues, les vues restent comptées et une alerte s'affiche.
        Les envois anormaux (trop de vues par source ou par session) sont ignorés automatiquement.
      </p>

      <h2>Usage interdit</h2>
      <ul>
        <li>Envoyer des données qui identifient une personne : un nom d'écran décrit un écran, jamais un utilisateur ou ses données.</li>
        <li>Envoyer de fausses vues, contourner les limites ou perturber le service.</li>
        <li>Utiliser le service pour une activité illégale.</li>
      </ul>

      <h2>Suspension</h2>
      <p>
        L'éditeur peut supprimer un compte qui ne respecte pas ces conditions, ou fermer le service, en prévenant par email lorsque c'est possible.
      </p>

      <h2>Votre compte</h2>
      <p>
        Vous êtes responsable de votre mot de passe. Vous pouvez supprimer votre compte à tout moment depuis la page Mon compte.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Ces conditions relèvent du droit français. Pour toute question : <a href="mailto:contact@clewig.fr">contact@clewig.fr</a>.
      </p>
    </template>

    <nav class="legal-links">
      <router-link :to="{ name: 'legal' }">
        Mentions légales
      </router-link>
      <router-link :to="{ name: 'privacy' }">
        Confidentialité
      </router-link>
      <router-link :to="{ name: 'terms' }">
        Conditions d'utilisation
      </router-link>
    </nav>
  </article>
</template>

<script>
import { api } from '@/api'
import { formatCount } from '@/quota'

export default {
  name: 'LegalPage',
  props: {
    page: { type: String, required: true }
  },
  data () {
    return { limits: null }
  },
  computed: {
    retentionText () {
      const days = this.limits?.retentionDays
      if (days === 0) return 'sans limite de durée'
      return `${days || 90} jours`
    },
    limitsText () {
      const l = this.limits
      if (!l) return 'un nombre limité d\'applications, de pages et de vues par mois, indiqué sur la page d\'accueil'
      const n = (value, unit) => value > 0 ? `${formatCount(value)} ${unit}` : `des ${unit} sans limite`
      return `${n(l.maxApps, 'applications')}, ${n(l.maxPagesPerApp, 'pages par application')} et ${n(l.maxMonthlyViews, 'vues par mois')}`
    }
  },
  mounted () {
    api.get('limits').then(limits => { this.limits = limits }).catch(() => {})
  }
}
</script>

<style scoped>
.legal { max-width: 720px; margin: 0 auto; }
.back { display: inline-block; margin-bottom: 16px; font-size: 0.9rem; }
h2 { margin-top: 28px; }
ul { padding-left: 20px; }
li { margin-bottom: 6px; }
table { margin: 8px 0 16px; font-size: 0.92rem; }
.legal-links { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 0.9rem; }
.legal-links .router-link-exact-active { color: var(--text); font-weight: 600; }
</style>
