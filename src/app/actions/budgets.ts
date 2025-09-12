'use server';

import { assertSpaceAccess, getCurrentUserId } from '@/app/actions/space';
import { db } from '@/db/client';
import { budgets } from '@/db/schema/budgets';
import { budgetsHistory } from '@/db/schema/budgets_history';
import { categories } from '@/db/schema/categories';
import { transactions } from '@/db/schema/transactions';
import { getSeoulMonthRange } from '@/lib/date';
import {
  budgetDeleteSchema,
  budgetUpsertSchema,
  type BudgetUpsertInput,
} from '@/lib/validation/budgets';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

// 반환 타입 정의: 목록용
export type BudgetProgress = {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  month: string;
  limit: number;
  spent: number;
  remaining: number;
};

type ListBudgetsParams = { slug: string; month: string };

export const listBudgets = async ({
  slug,
  month,
}: ListBudgetsParams): Promise<BudgetProgress[]> => {
  const parsedMonth = budgetUpsertSchema.shape.month.safeParse(month);
  if (!parsedMonth.success)
    throw new Error(parsedMonth.error.issues[0]?.message || '월은 YYYY-MM 형식으로 입력하세요');

  const { spaceId } = await assertSpaceAccess(slug);
  const { start, end } = getSeoulMonthRange(month);

  // Fetch budgets with category meta
  const rows = await db
    .select({
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      month: budgets.month,
      limit: budgets.amount,
      categoryName: categories.name,
      categoryKind: categories.kind,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(budgets)
    .leftJoin(categories, eq(categories.id, budgets.categoryId))
    .where(
      and(
        eq(budgets.spaceId, spaceId),
        eq(budgets.month, month),
        eq(categories.kind, 'expense'), // 방어적 필터: 지출 카테고리만
      ),
    );

  if (rows.length === 0) return [] as BudgetProgress[];

  const categoryIds = rows.map((r) => r.categoryId);

  // Sum spent for each category within month range, type='expense', exclude transfers implicitly
  // amount is numeric; SUM returns text in drizzle, cast later
  const spentRows = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.spaceId, spaceId),
        eq(transactions.type, 'expense'),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
        inArray(transactions.categoryId, categoryIds),
      ),
    )
    .groupBy(transactions.categoryId);

  const spentMap = new Map<string, number>();
  for (const s of spentRows) {
    // drizzle의 numeric SUM은 문자열로 반환되므로 숫자로 변환
    const n = Number(s.spent);
    spentMap.set(s.categoryId!, Number.isFinite(n) ? n : 0);
  }

  return rows.map((r) => {
    const limitNum = Number(r.limit);
    const safeLimit = Number.isFinite(limitNum) ? limitNum : 0;
    const spent = spentMap.get(r.categoryId) ?? 0;
    return {
      budgetId: r.budgetId,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      categoryIcon: r.categoryIcon ?? null,
      month: r.month,
      limit: safeLimit,
      spent,
      remaining: safeLimit - spent,
    } satisfies BudgetProgress;
  });
};

export const upsertBudget = async (slug: string, input: BudgetUpsertInput) => {
  const parsed = budgetUpsertSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || '잘못된 입력입니다');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('인증이 필요합니다');

  // Cross-entity validations: category belongs to space and is expense
  const cat = await db
    .select({ id: categories.id, kind: categories.kind })
    .from(categories)
    .where(and(eq(categories.id, data.categoryId), eq(categories.spaceId, spaceId)))
    .limit(1);
  if (!cat[0]) throw new Error('잘못된 카테고리입니다');
  if (cat[0].kind !== 'expense') throw new Error('예산은 지출 카테고리에만 설정할 수 있습니다');

  const amountFixed = Number.isFinite(data.amount) ? data.amount.toFixed(2) : undefined;
  if (!amountFixed) throw new Error('유효하지 않은 금액입니다');

  // Atomic upsert + history within a transaction
  return await db.transaction(async (tx) => {
    // Check if budget exists
    const existing = await tx
      .select({ id: budgets.id, amount: budgets.amount })
      .from(budgets)
      .where(
        and(
          eq(budgets.spaceId, spaceId),
          eq(budgets.categoryId, data.categoryId),
          eq(budgets.month, data.month),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      // create new budget
      const [row] = await tx
        .insert(budgets)
        .values({
          spaceId,
          categoryId: data.categoryId,
          month: data.month,
          amount: amountFixed,
          createdBy: userId,
        })
        .returning({ id: budgets.id });

      await tx.insert(budgetsHistory).values({
        budgetId: row.id,
        prevAmount: null,
        newAmount: amountFixed,
        changedBy: userId,
      });
      return row;
    }

    // update existing and add history
    const [row] = await tx
      .update(budgets)
      .set({ amount: amountFixed, updatedAt: new Date() })
      .where(and(eq(budgets.id, existing[0].id), eq(budgets.spaceId, spaceId)))
      .returning({ id: budgets.id });

    await tx.insert(budgetsHistory).values({
      budgetId: existing[0].id,
      prevAmount: existing[0].amount,
      newAmount: amountFixed,
      changedBy: userId,
    });

    return row;
  });
};

export const deleteBudget = async (slug: string, input: { categoryId: string; month: string }) => {
  const parsed = budgetDeleteSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || '잘못된 입력입니다');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);

  const res = await db
    .delete(budgets)
    .where(
      and(
        eq(budgets.spaceId, spaceId),
        eq(budgets.categoryId, data.categoryId),
        eq(budgets.month, data.month),
      ),
    )
    .returning({ id: budgets.id });
  return res[0] ?? null;
};

export const listBudgetHistory = async (
  slug: string,
  input: { categoryId: string; month?: string },
) => {
  if (input.month) {
    const pm = budgetUpsertSchema.shape.month.safeParse(input.month);
    if (!pm.success)
      throw new Error(pm.error.issues[0]?.message || '월은 YYYY-MM 형식으로 입력하세요');
  }
  const { spaceId } = await assertSpaceAccess(slug);

  // Ensure category belongs to space
  const cat = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.spaceId, spaceId)))
    .limit(1);
  if (!cat[0]) throw new Error('잘못된 카테고리입니다');

  if (input.month) {
    // Single month history
    const b = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(
        and(
          eq(budgets.spaceId, spaceId),
          eq(budgets.categoryId, input.categoryId),
          eq(budgets.month, input.month),
        ),
      )
      .limit(1);
    const budgetId = b[0]?.id;
    if (!budgetId) return [] as { prevAmount: number | null; newAmount: number; changedAt: Date }[];
    const rows = await db
      .select({
        prev: budgetsHistory.prevAmount,
        next: budgetsHistory.newAmount,
        changedAt: budgetsHistory.changedAt,
      })
      .from(budgetsHistory)
      .where(eq(budgetsHistory.budgetId, budgetId))
      .orderBy(desc(budgetsHistory.changedAt));

    return rows.map((r) => ({
      prevAmount: r.prev === null ? null : Number(r.prev),
      newAmount: Number(r.next),
      changedAt: r.changedAt,
    }));
  }

  // All history across all months for this category in space
  const budgetIds = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(and(eq(budgets.spaceId, spaceId), eq(budgets.categoryId, input.categoryId)));
  if (budgetIds.length === 0)
    return [] as {
      budgetId: string;
      prevAmount: number | null;
      newAmount: number;
      changedAt: Date;
    }[];

  const rows = await db
    .select({
      budgetId: budgetsHistory.budgetId,
      prev: budgetsHistory.prevAmount,
      next: budgetsHistory.newAmount,
      changedAt: budgetsHistory.changedAt,
    })
    .from(budgetsHistory)
    .where(
      inArray(
        budgetsHistory.budgetId,
        budgetIds.map((b) => b.id),
      ),
    )
    .orderBy(desc(budgetsHistory.changedAt));

  return rows.map((r) => ({
    budgetId: r.budgetId,
    prevAmount: r.prev === null ? null : Number(r.prev),
    newAmount: Number(r.next),
    changedAt: r.changedAt,
  }));
};
