import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'access_token';
const LOGIN_PATH = '/login';

/**
 * Route protection. The backend sets an httpOnly JWT cookie that — thanks to
 * the same-origin /api proxy — lives on this web origin, so we can gate routes
 * by its presence. Signature/expiry is still authoritatively checked by the
 * API; an expired token simply yields a 401 there and the client returns here.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(AUTH_COOKIE);
  const isLoginPage = pathname === LOGIN_PATH;

  if (!hasToken && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (hasToken && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/patients';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, the API proxy, and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
