import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Public asset/file patterns (skip middleware)
const PUBLIC_FILE = /\.(.*)$/;

// Explicit public routes (URL paths)
const PUBLIC_PATHS = new Set<string>(['/', '/sign-in', '/auth/callback', '/demo']);

export const middleware = async (req: NextRequest) => {
  const { pathname, search } = req.nextUrl;

  // Skip static files and Next.js internals
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Public routes (authentication group etc.)
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/auth/')) {
    // If already authenticated and visiting sign-in, go to /home
    if (pathname === '/sign-in' && req.cookies.has('sb-access-token')) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  // Lightweight auth check via Supabase cookies
  const hasAccessToken = req.cookies.has('sb-access-token');

  if (!hasAccessToken) {
    // Unauthenticated users are sent to landing page
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If we have an access token, refresh session & sync cookies into the response
  // so that rotating tokens stay persisted across navigations.
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  try {
    await supabase.auth.getUser();
  } catch {
    // noop: even if this fails, the auth guard above already protects routes
  }

  return res;
};

// Matcher: run on most application routes; exclude common public assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|public/).*)'],
};
