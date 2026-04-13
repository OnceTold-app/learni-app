// PostHog analytics client
// Set NEXT_PUBLIC_POSTHOG_KEY in your .env.local (get from posthog.com after signup)
// Set NEXT_PUBLIC_POSTHOG_HOST (default: https://app.posthog.com)

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

// Track a custom event (client-side only)
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!POSTHOG_KEY) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph && typeof ph.capture === 'function') {
      ph.capture(event, properties)
    }
  } catch {
    // non-fatal
  }
}

// Identify a user (parent account)
export function identify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!POSTHOG_KEY) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph && typeof ph.identify === 'function') {
      ph.identify(userId, properties)
    }
  } catch {
    // non-fatal
  }
}

// Reset on logout
export function reset() {
  if (typeof window === 'undefined') return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph && typeof ph.reset === 'function') {
      ph.reset()
    }
  } catch {
    // non-fatal
  }
}
