import { describe, expect, it } from 'vitest';
import { isSafeInternalPath } from '../redirect';

describe('isSafeInternalPath', () => {
  it('accepts normal internal paths', () => {
    expect(isSafeInternalPath('/')).toBe(true);
    expect(isSafeInternalPath('/dashboard')).toBe(true);
    expect(isSafeInternalPath('/foo/bar?x=1')).toBe(true);
  });

  it('rejects null/empty/relative', () => {
    expect(isSafeInternalPath('')).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath('dashboard')).toBe(false);
  });

  it('rejects scheme-relative and external', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
  });
});
