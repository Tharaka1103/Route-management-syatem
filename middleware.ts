import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect /login to /auth/signin
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/', '/api/auth']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (isPublicRoute) {
      return NextResponse.next()
    }

    // If no token and not on public route, redirect to signin
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Role-based route protection
    const role = token.role as string

    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Driver routes
    if (pathname.startsWith('/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Department head routes
    if (pathname.startsWith('/department-head') && role !== 'department_head') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Project manager routes
    if (pathname.startsWith('/project-manager') && role !== 'project_manager') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // User dashboard routes
    if (pathname.startsWith('/dashboard') && !['user', 'department_head', 'project_manager'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Ensure drivers only access driver routes (except ride tracking)
    if (role === 'driver' && !pathname.startsWith('/driver') && !pathname.startsWith('/ride/') && !pathname.startsWith('/api/') && pathname !== '/') {
      return NextResponse.redirect(new URL('/driver', req.url))
    }

    // Ensure admins access appropriate routes
    if (role === 'admin' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // Ensure department heads access appropriate routes
    if (role === 'department_head' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/department-head', req.url))
    }

    // Ensure project managers access appropriate routes
    if (role === 'project_manager' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/project-manager', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This function determines if the middleware should run
        // Return true to run middleware, false to skip
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
