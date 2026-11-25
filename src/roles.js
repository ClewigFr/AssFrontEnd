// Roles on an application, as the backend returns them in `role` (GET /apps, GET /apps/{id}).
// Each level includes the previous ones: read sees the stats, manage also handles pages and
// deletes views, owner also deletes the application and shares it.
const LEVELS = { read: 1, manage: 2, owner: 3 }

export const ROLE_LABELS = { read: 'Lecture', manage: 'Gestion', owner: 'Propriétaire' }

// Applications from before sharing have no role: they are the caller's own
export function roleOf (app) {
  return app?.role || 'owner'
}

export function can (app, role) {
  return (LEVELS[roleOf(app)] || 0) >= LEVELS[role]
}

export function isShared (app) {
  return roleOf(app) !== 'owner'
}

export function shareError (error) {
  if (error?.status === 404) return 'Aucun compte avec cet email : la personne doit d\'abord créer un compte.'
  if (error?.status === 409) return 'C\'est votre propre compte.'
  if (error?.status === 400) return 'Indiquez un email et un rôle.'
  return ''
}
