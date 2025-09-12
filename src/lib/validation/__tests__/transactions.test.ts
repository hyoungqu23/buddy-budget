import { transactionCreateSchema, transactionUpdateSchema } from '@/lib/validation/transactions';
import { describe, expect, it } from 'vitest';

describe('transactionCreateSchema', () => {
  it('accepts valid expense', () => {
    const out = transactionCreateSchema.safeParse({
      type: 'expense',
      amount: 1000,
      occurredAt: new Date().toISOString(),
      categoryId: crypto.randomUUID(),
      fromHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(true);
  });

  it('accepts valid income', () => {
    const out = transactionCreateSchema.safeParse({
      type: 'income',
      amount: 500,
      occurredAt: new Date().toISOString(),
      categoryId: crypto.randomUUID(),
      toHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(true);
  });

  it('accepts valid transfer', () => {
    const out = transactionCreateSchema.safeParse({
      type: 'transfer',
      amount: 200,
      occurredAt: new Date().toISOString(),
      fromHoldingId: crypto.randomUUID(),
      toHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(true);
  });

  it('rejects transfer with same from/to', () => {
    const id = crypto.randomUUID();
    const out = transactionCreateSchema.safeParse({
      type: 'transfer',
      amount: 200,
      occurredAt: new Date().toISOString(),
      fromHoldingId: id,
      toHoldingId: id,
    });
    expect(out.success).toBe(false);
  });

  it('rejects amount <= 0', () => {
    const out = transactionCreateSchema.safeParse({
      type: 'expense',
      amount: 0,
      occurredAt: new Date().toISOString(),
      categoryId: crypto.randomUUID(),
      fromHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(false);
  });

  it('rejects transfer with categoryId', () => {
    const out = transactionCreateSchema.safeParse({
      type: 'transfer',
      amount: 100,
      occurredAt: new Date().toISOString(),
      fromHoldingId: crypto.randomUUID(),
      toHoldingId: crypto.randomUUID(),
      categoryId: crypto.randomUUID(),
    });
    expect(out.success).toBe(false);
  });
});

describe('transactionUpdateSchema', () => {
  it('allows partial update without type', () => {
    const out = transactionUpdateSchema.safeParse({ memo: 'note' });
    expect(out.success).toBe(true);
  });

  it('rejects expense patch with toHoldingId set', () => {
    const out = transactionUpdateSchema.safeParse({
      type: 'expense',
      toHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(false);
  });

  it('rejects income patch with fromHoldingId set', () => {
    const out = transactionUpdateSchema.safeParse({
      type: 'income',
      fromHoldingId: crypto.randomUUID(),
    });
    expect(out.success).toBe(false);
  });

  it('rejects transfer patch with categoryId set', () => {
    const out = transactionUpdateSchema.safeParse({
      type: 'transfer',
      categoryId: crypto.randomUUID(),
    });
    expect(out.success).toBe(false);
  });
});
