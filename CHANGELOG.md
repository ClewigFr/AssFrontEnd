# Changelog

## Unreleased

### Eco-design
- The activity chart is plain SVG (`ActivityChart.vue`) instead of ApexCharts: the stats page loads 10 kB of JavaScript instead of 290 kB (gzipped), and follows the light or dark theme through CSS.
- Periods already loaded are reused while the stats page is open (the current one for a minute).
- Text files are gzipped at build time and served as is (`gzip_static`); missing files get a 404 instead of the app's HTML; a print stylesheet; a meta description and a `robots.txt`.
- The home page is in the main bundle, and the session is checked once at startup instead of twice.
- Removed the unused `src/assets/logo.png`.

### Added
- Pages section of the stats: a « Tableau / Camembert » switch, remembered in the browser. The donut shows each page's share of the views (the 6 busiest, the rest in « Autres »), with a legend; hovering a slice shows its figures, clicking it opens the page's stats.
- « Parcours » tab on an application: most frequent screen-to-screen transitions (sessions, mean time before), entry and exit screens, per period, from the backend's `GET /apps/{app}/flows`. Rare transitions are only counted, never one person's path.
- The presentation page shows the latest version of each library (Android, iOS) in its snippets, from the backend's `GET /versions`, with built-in versions as a fallback.
- Shared applications appear in « Mes applications » with a « Partagée · Lecture/Gestion » badge, and don't count in the account's application quota.
- « Partage » section in the Configuration tab (owner only): share by email with a role, list and remove shares.
- A member can leave a shared application (« Quitter cette application »).

### Changed
- Actions are hidden according to the role: readers only see the pages and stats, managers can't delete the application or share it.
- Needs an AssBackend with application sharing (`/apps/{app}/members`).
