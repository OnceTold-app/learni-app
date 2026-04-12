import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Serve landing page directly for homepage — no redirect
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/index.html'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
