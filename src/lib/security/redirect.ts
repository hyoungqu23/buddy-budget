export const isSafeInternalPath = (p: string | null | undefined): boolean => {
  if (!p) return false;
  // must start with single slash, disallow protocol-like or scheme-relative
  if (!p.startsWith('/')) return false;
  if (p.startsWith('//')) return false;
  // basic path sanity; optionally extend with allowlist later
  return true;
};

