/**
 * auth-utils.ts
 * Centralised session management for parent and child auth.
 * Parent nav never reads child keys. Child nav never reads parent keys.
 * On 401 — clear all session data and redirect to login.
 */

const CHILD_KEYS = [
  'learni_child_id',
  'learni_child_name',
  'learni_child_pin',
  'learni_child_username',
  'learni_year_level',
  'learni_session_language',
  'learni_session_topic',
  'learni_session_mode',
  'learni_subject',
  'learni_baseline_level',
  'learni_baseline_level_name',
  'learni_baseline_strengths',
  'learni_baseline_gaps',
  'learni_cached_stars',
  'learni_last_subject',
  'learni_voice_enabled',
  'learni_avatar_url',
  'learni_checkin_nudge',
  'learni_homework_topics',
  'learni_start_subject',
]

const PARENT_KEYS = [
  'learni_parent_token',
  'learni_parent_name',
  'learni_parent_email',
  'learni_parent_id',
]

export function clearChildSession() {
  CHILD_KEYS.forEach(k => localStorage.removeItem(k))
}

export function clearParentSession() {
  PARENT_KEYS.forEach(k => localStorage.removeItem(k))
}

export function clearAllSessions() {
  clearChildSession()
  clearParentSession()
}

/** Call on any 401 from a parent API call */
export function handleParent401() {
  clearAllSessions()
  window.location.href = '/login'
}

/** Call on any 401 from a child API call */
export function handleChild401() {
  clearChildSession()
  window.location.href = '/kid-login'
}

/** Safe fetch wrapper — auto-handles 401 for child routes */
export async function childFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)
  if (res.status === 401) {
    handleChild401()
  }
  return res
}

/** Safe fetch wrapper — auto-handles 401 for parent routes */
export async function parentFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)
  if (res.status === 401) {
    handleParent401()
  }
  return res
}
