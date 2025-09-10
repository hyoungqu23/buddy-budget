import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Public asset/file patterns (skip middleware)
const PUBLIC_FILE = /\.(.*)$/;

// Explicit public routes (URL paths)
const PUBLIC_PATHS = new Set<string>([
  '/', // landing (keep public; adjust if needed)
  '/sign-in',
  '/auth/callback',
  '/demo',
]);

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
    return NextResponse.next();
  }

  // Lightweight auth check via Supabase cookies
  const hasAccessToken = req.cookies.has('sb-access-token');

  if (!hasAccessToken) {
    const url = new URL('/sign-in', req.url);
    // preserve target for post-sign-in routing
    url.searchParams.set('next', pathname + (search || ''));
    return NextResponse.redirect(url);
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
