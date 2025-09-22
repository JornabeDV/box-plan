import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para manejar autenticación y redirecciones
 * Protege rutas que requieren autenticación
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas que requieren autenticación
  const protectedRoutes = ['/profile', '/subscription', '/workout-sheets']
  const authRoutes = ['/login', '/signup', '/reset-password']

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Si es una ruta protegida y no hay sesión, redirigir a login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si es una ruta de auth y ya hay sesión, redirigir a home
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Manejar parámetros de confirmación de email
  if (req.nextUrl.searchParams.get('confirmed') === 'true') {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('message', 'Email confirmado exitosamente')
    return NextResponse.redirect(redirectUrl)
  }

  if (req.nextUrl.searchParams.get('recovery') === 'true') {
    return NextResponse.redirect(new URL('/reset-password', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}