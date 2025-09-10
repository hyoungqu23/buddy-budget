export const buildOAuthRedirect = (baseCallbackUrl: string, next?: string | null) => {
  const base = baseCallbackUrl || '/auth/callback';
  if (next && next.length > 0) {
    const url = new URL(base, 'http://dummy');
    url.searchParams.set('next', next);
    // drop dummy origin
    return url.pathname + url.search;
  }
  return base;
};

