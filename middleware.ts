import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log('🛡️ Middleware running for:', pathname);
  console.log('🍪 Token exists:', !!token);

  // Define public API routes that don't need authentication
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout'
  ];

  // If it's a public API route, allow access
  if (publicApiRoutes.includes(pathname)) {
    console.log('📂 Public API route accessed:', pathname);
    return NextResponse.next();
  }

  // Handle home and login pages
  if (pathname === '/login' || pathname === '/') {
    // For public pages, we'll let the client-side handle token verification
    console.log('📂 Public page accessed:', pathname);
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api') || pathname.startsWith('/map')) {
    console.log('🔒 Protected route accessed:', pathname);
    
    if (!token) {
      console.log('❌ No token found for protected route');
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For protected routes, we have a token but can't verify it here in Edge runtime
    // The actual verification will happen in the API routes or client-side
    console.log('🎫 Token found for protected route, verification will happen server-side');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/login',
    '/',
    '/map'
  ]
};