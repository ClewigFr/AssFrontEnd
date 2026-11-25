# Changelog

## Unreleased

### Added
- The presentation page shows the latest version of each library (Android, iOS) in its snippets, from the backend's `GET /versions`, with built-in versions as a fallback.
- Shared applications appear in « Mes applications » with a « Partagée · Lecture/Gestion » badge, and don't count in the account's application quota.
- « Partage » section in the Configuration tab (owner only): share by email with a role, list and remove shares.
- A member can leave a shared application (« Quitter cette application »).

### Changed
- Actions are hidden according to the role: readers only see the pages and stats, managers can't delete the application or share it.
- Needs an AssBackend with application sharing (`/apps/{app}/members`).
