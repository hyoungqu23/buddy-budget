import { z } from 'zod';

const base = z.object({
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  occurredAt: z.string().min(1, '일시를 선택하세요'),
  memo: z.string().max(500).optional(),
});

const expense = base
  .extend({
    type: z.literal('expense'),
    categoryId: z.string().uuid('유효한 카테고리를 선택하세요'),
    fromHoldingId: z.string().uuid('유효한 계정을 선택하세요'),
  })
  .strict();

const income = base
  .extend({
    type: z.literal('income'),
    categoryId: z.string().uuid('유효한 카테고리를 선택하세요'),
    toHoldingId: z.string().uuid('유효한 계정을 선택하세요'),
  })
  .strict();

const transfer = base
  .extend({
    type: z.literal('transfer'),
    fromHoldingId: z.string().uuid('유효한 출금 계정을 선택하세요'),
    toHoldingId: z.string().uuid('유효한 입금 계정을 선택하세요'),
  })
  .strict();

const transactionCreateCore = z.discriminatedUnion('type', [expense, income, transfer]);
export const transactionCreateSchema = transactionCreateCore.superRefine((v, ctx) => {
  if (v.type === 'transfer' && v.fromHoldingId === v.toHoldingId) {
    ctx.addIssue({
      code: 'custom',
      message: '서로 다른 계정을 선택하세요',
      path: ['toHoldingId'],
    });
  }
});
export const transactionUpdateSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    amount: z.number().positive('금액은 0보다 커야 합니다').optional(),
    occurredAt: z.string().min(1, '일시를 선택하세요').optional(),
    memo: z.string().max(500).optional(),
    categoryId: z.string().uuid('유효한 카테고리를 선택하세요').optional(),
    fromHoldingId: z.string().uuid('유효한 계정을 선택하세요').optional(),
    toHoldingId: z.string().uuid('유효한 계정을 선택하세요').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'expense') {
      if (v.toHoldingId !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '지출에는 입금 계정을 지정할 수 없습니다',
          path: ['toHoldingId'],
        });
      }
    }
    if (v.type === 'income') {
      if (v.fromHoldingId !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '수입에는 출금 계정을 지정할 수 없습니다',
          path: ['fromHoldingId'],
        });
      }
    }
    if (v.type === 'transfer') {
      if (v.categoryId !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '이체에는 카테고리를 지정할 수 없습니다',
          path: ['categoryId'],
        });
      }
      if (v.fromHoldingId && v.toHoldingId && v.fromHoldingId === v.toHoldingId) {
        ctx.addIssue({
          code: 'custom',
          message: '서로 다른 계정을 선택하세요',
          path: ['toHoldingId'],
        });
      }
    }
  });

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
