'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/posthog'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph && pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      ph.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider() {
  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === 'undefined') return

    import('posthog-js').then(({ default: posthog }) => {
      if (!(window as any).posthog) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // We handle pageviews manually
          capture_pageleave: true,
          autocapture: false, // Manual tracking only
          persistence: 'localStorage',
          loaded: (ph) => {
            if (process.env.NODE_ENV === 'development') ph.debug()
          },
        })
        ;(window as any).posthog = posthog
      }
    }).catch(() => {/* posthog load failed — non-fatal */})
  }, [])

  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}
