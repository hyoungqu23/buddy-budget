import { updateSpaceSchema } from '@/lib/validation/space';
import { describe, expect, it } from 'vitest';

describe('updateSpaceSchema', () => {
  it('accepts valid name and slug', () => {
    const out = updateSpaceSchema.safeParse({ name: '우리집', slug: 'woori-house-1' });
    expect(out.success).toBe(true);
  });

  it('rejects empty name', () => {
    const out = updateSpaceSchema.safeParse({ name: '', slug: 'abc' });
    expect(out.success).toBe(false);
  });

  it('rejects invalid slug', () => {
    const out = updateSpaceSchema.safeParse({ name: 'x', slug: 'ABC!!' });
    expect(out.success).toBe(false);
  });
});
