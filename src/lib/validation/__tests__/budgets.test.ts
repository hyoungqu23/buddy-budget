import { budgetUpsertSchema, monthString } from '@/lib/validation/budgets';
import { describe, expect, it } from 'vitest';

describe('monthString', () => {
  it('accepts valid YYYY-MM', () => {
    expect(monthString.safeParse('2025-01').success).toBe(true);
    expect(monthString.safeParse('1999-12').success).toBe(true);
  });
  it('rejects invalid format', () => {
    for (const v of ['2025-1', '25-01', '2025-13', '2025-00', '2025-aa', '']) {
      expect(monthString.safeParse(v).success).toBe(false);
    }
  });
});

describe('budgetUpsertSchema', () => {
  it('validates positive amount and uuid category', () => {
    const valid = budgetUpsertSchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      month: '2025-09',
      amount: 1000.5,
    });
    expect(valid.success).toBe(true);
  });
  it('rejects non-positive amount', () => {
    for (const n of [0, -1, -0.01]) {
      const res = budgetUpsertSchema.safeParse({
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        month: '2025-09',
        amount: n,
      });
      expect(res.success).toBe(false);
    }
  });
  it('rejects invalid uuid', () => {
    const res = budgetUpsertSchema.safeParse({ categoryId: 'x', month: '2025-09', amount: 1 });
    expect(res.success).toBe(false);
  });
});
