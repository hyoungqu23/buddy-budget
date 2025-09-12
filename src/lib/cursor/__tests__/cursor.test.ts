import { decodeCursor, encodeCursor, type CreatedAtIdCursor } from '@/lib/cursor';
import { describe, expect, it } from 'vitest';

describe('cursor encoding/decoding', () => {
  it('roundtrips createdAt/id', () => {
    const c: CreatedAtIdCursor = { createdAt: new Date().toISOString(), id: 'abc-123' };
    const s = encodeCursor(c);
    const d = decodeCursor<CreatedAtIdCursor>(s);
    expect(d).toEqual(c);
  });
});
