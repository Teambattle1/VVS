// Login/logout events lagres lokalt (localStorage) indtil vi har
// en Supabase audit-tabel der tillader system-events uden job_id.

const STORAGE_KEY = 'vvs.authEvents'
const MAX_EVENTS = 200

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function write(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
  } catch {
    /* quota full osv. - ignorer */
  }
}

export function logAuthEvent({ type, userId, userEmail, userName }) {
  const events = read()
  events.push({
    id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type, // 'login' | 'logout'
    user_id: userId || null,
    user_email: userEmail || null,
    user_name: userName || userEmail || 'Bruger',
    timestamp: new Date().toISOString(),
  })
  write(events)
}

export function getAuthEvents() {
  return read()
}

export function clearAuthEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
