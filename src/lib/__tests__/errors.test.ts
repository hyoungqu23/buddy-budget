import { mapUniqueNameError } from '@/lib/errors';
import { describe, expect, it } from 'vitest';

describe('mapUniqueNameError', () => {
  it('detects duplicate key substrings', () => {
    expect(mapUniqueNameError('duplicate key value violates unique constraint')).toBe(
      '이미 존재하는 이름입니다',
    );
  });

  it('detects custom tokens', () => {
    expect(
      mapUniqueNameError('u_categories_space_name constraint', ['u_categories_space_name']),
    ).toBe('이미 존재하는 이름입니다');
  });

  it('returns undefined for other errors', () => {
    expect(mapUniqueNameError('random error')).toBeUndefined();
  });
});
