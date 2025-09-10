import { describe, expect, it } from 'vitest';
import { buildOAuthRedirect } from '../url';

describe('buildOAuthRedirect', () => {
  it('returns base when next is empty', () => {
    expect(buildOAuthRedirect('/auth/callback', '')).toBe('/auth/callback');
  });

  it('appends next as query preserving path only', () => {
    const out = buildOAuthRedirect('/auth/callback', '/dashboard?x=1');
    expect(out).toBe('/auth/callback?next=%2Fdashboard%3Fx%3D1');
  });
});

