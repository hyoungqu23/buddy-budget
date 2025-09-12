import { z } from 'zod';

// YYYY-MM 포맷 체크
export const monthString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, '월은 YYYY-MM 형식으로 입력하세요');

export const budgetUpsertSchema = z.object({
  categoryId: z.string().uuid('유효한 카테고리를 선택하세요'),
  month: monthString,
  amount: z.coerce.number().positive('금액은 0보다 커야 합니다'),
});

export const budgetDeleteSchema = z.object({
  categoryId: z.string().uuid('유효한 카테고리를 선택하세요'),
  month: monthString,
});

export type BudgetUpsertInput = z.infer<typeof budgetUpsertSchema>;
export type BudgetDeleteInput = z.infer<typeof budgetDeleteSchema>;
