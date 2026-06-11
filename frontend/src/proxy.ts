import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // Basic route protection placeholder
  // TODO: Implement actual Supabase session check when connected
  // For now, allow everything for the demo.
  
  // If we had a session token:
  // const token = request.cookies.get('sb-access-token');
  // if (!token && !isAuthPage) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  // if (token && isAuthPage) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
