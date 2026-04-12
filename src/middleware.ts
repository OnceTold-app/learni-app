import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Serve landing page directly for homepage — no redirect
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/index.html'
    return NextResponse.rewrite(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{name: string; value: string; options?: Record<string, unknown>}>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /hub and /learn routes
  const isProtected =
    request.nextUrl.pathname.startsWith('/hub') ||
    request.nextUrl.pathname.startsWith('/learn')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|css|js|ico)$).*)',
  ],
}
