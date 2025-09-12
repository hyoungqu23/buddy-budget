'use server';

import { assertSpaceAccess, getCurrentUserId } from '@/app/actions/space';
import { db } from '@/db/client';
import { categories } from '@/db/schema/categories';
import { holdings } from '@/db/schema/holdings';
import { transactions } from '@/db/schema/transactions';
import { CreatedAtIdCursor, decodeCursor, encodeCursor } from '@/lib/cursor';
import {
  TransactionCreateInput,
  TransactionUpdateInput,
  transactionCreateSchema,
  transactionUpdateSchema,
} from '@/lib/validation/transactions';
import { and, desc, eq, gte, ilike, inArray, lt, lte, or } from 'drizzle-orm';

type ListParams = {
  slug: string;
  limit?: number;
  cursor?: string | null;
  q?: string; // memo search
  type?: ('income' | 'expense' | 'transfer')[] | 'income' | 'expense' | 'transfer';
  categoryId?: string;
  holdingId?: string; // matches fromHoldingId or toHoldingId
  from?: string; // ISO date string (inclusive)
  to?: string; // ISO date string (inclusive)
};

export const listInfiniteTransactions = async (params: ListParams) => {
  const { slug, q, categoryId, holdingId } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

  const { spaceId } = await assertSpaceAccess(slug);

  let cursorCond;
  if (params.cursor) {
    const c = decodeCursor<CreatedAtIdCursor>(params.cursor);
    const occurred = new Date(c.createdAt);
    cursorCond = or(
      lt(transactions.occurredAt, occurred),
      and(eq(transactions.occurredAt, occurred), lt(transactions.id, c.id)),
    );
  }

  let whereCond = eq(transactions.spaceId, spaceId);
  if (cursorCond) whereCond = and(whereCond, cursorCond);
  if (params.from) {
    const fromDate = new Date(params.from);
    if (!isNaN(fromDate.getTime())) {
      whereCond = and(whereCond, gte(transactions.occurredAt, fromDate));
    }
  }
  if (params.to) {
    const raw = params.to;
    const toDate = new Date(raw);
    if (!isNaN(toDate.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        toDate.setHours(23, 59, 59, 999);
      }
      whereCond = and(whereCond, lte(transactions.occurredAt, toDate));
    }
  }
  if (q && q.trim()) whereCond = and(whereCond, ilike(transactions.memo, `%${q.trim()}%`));

  const types = Array.isArray(params.type) ? params.type : params.type ? [params.type] : [];
  if (types.length > 0) whereCond = and(whereCond, inArray(transactions.type, types));

  if (categoryId) whereCond = and(whereCond, eq(transactions.categoryId, categoryId));
  if (holdingId)
    whereCond = and(
      whereCond,
      or(eq(transactions.fromHoldingId, holdingId), eq(transactions.toHoldingId, holdingId)),
    );

  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      memo: transactions.memo,
      categoryId: transactions.categoryId,
      fromHoldingId: transactions.fromHoldingId,
      toHoldingId: transactions.toHoldingId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(whereCond)
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? encodeCursor<CreatedAtIdCursor>({
        createdAt: items[items.length - 1].occurredAt.toISOString(),
        id: items[items.length - 1].id,
      })
    : null;

  return { items, nextCursor };
};

export const createTransaction = async (slug: string, input: TransactionCreateInput) => {
  const parsed = transactionCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  const safeFixed = Number.isFinite(data.amount) ? data.amount.toFixed(2) : undefined;
  if (!safeFixed) throw new Error('유효하지 않은 금액입니다');

  const values: typeof transactions.$inferInsert = {
    spaceId,
    type: data.type,
    amount: safeFixed,
    occurredAt: new Date(data.occurredAt),
    memo: data.memo,
    categoryId: data.type === 'transfer' ? undefined : data.categoryId,
    fromHoldingId:
      data.type === 'expense' || data.type === 'transfer' ? (data as any).fromHoldingId : undefined,
    toHoldingId:
      data.type === 'income' || data.type === 'transfer' ? (data as any).toHoldingId : undefined,
    createdBy: userId,
  };

  const [row] = await db.insert(transactions).values(values).returning({ id: transactions.id });
  return row;
};

export const updateTransaction = async (
  slug: string,
  id: string,
  input: TransactionUpdateInput,
) => {
  const parsed = transactionUpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);

  // Fetch current row to determine effective type when not provided
  const current = await db
    .select({
      type: transactions.type,
      categoryId: transactions.categoryId,
      fromHoldingId: transactions.fromHoldingId,
      toHoldingId: transactions.toHoldingId,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.spaceId, spaceId)))
    .limit(1);
  if (!current[0]) throw new Error('존재하지 않는 거래입니다');
  const effectiveType = data.type ?? current[0].type;

  // Enforce forbidden field rules based on effective type
  if (effectiveType === 'expense' && data.toHoldingId !== undefined) {
    throw new Error('지출에는 입금 계정을 지정할 수 없습니다');
  }
  if (effectiveType === 'income' && data.fromHoldingId !== undefined) {
    throw new Error('수입에는 출금 계정을 지정할 수 없습니다');
  }
  if (effectiveType === 'transfer') {
    if (data.categoryId !== undefined) {
      throw new Error('이체에는 카테고리를 지정할 수 없습니다');
    }
    const fromId = data.fromHoldingId ?? current[0].fromHoldingId ?? undefined;
    const toId = data.toHoldingId ?? current[0].toHoldingId ?? undefined;
    if (fromId && toId && fromId === toId) {
      throw new Error('이체는 서로 다른 계정을 선택해야 합니다');
    }
  }

  const patch: Partial<typeof transactions.$inferInsert> = {
    type: data.type,
    amount:
      data.amount !== undefined
        ? Number.isFinite(data.amount)
          ? data.amount.toFixed(2)
          : undefined
        : undefined,
    occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
    memo: data.memo,
    categoryId: data.categoryId,
    fromHoldingId: data.fromHoldingId,
    toHoldingId: data.toHoldingId,
    updatedAt: new Date(),
  };
  if (data.amount !== undefined && patch.amount === undefined) {
    throw new Error('유효하지 않은 금액입니다');
  }

  // Enforce required fields considering current values
  const finalCategoryId = patch.categoryId ?? current[0].categoryId ?? undefined;
  const finalFrom = patch.fromHoldingId ?? current[0].fromHoldingId ?? undefined;
  const finalTo = patch.toHoldingId ?? current[0].toHoldingId ?? undefined;

  if (effectiveType === 'expense') {
    if (!finalCategoryId) throw new Error('지출에는 카테고리가 필요합니다');
    if (!finalFrom) throw new Error('지출에는 출금 계정이 필요합니다');
    // normalize forbidden opposite field: 항상 null로 정리(타입 변경 시 기존 값 제거)
    patch.toHoldingId = null;
  }
  if (effectiveType === 'income') {
    if (!finalCategoryId) throw new Error('수입에는 카테고리가 필요합니다');
    if (!finalTo) throw new Error('수입에는 입금 계정이 필요합니다');
    patch.fromHoldingId = null;
  }
  if (effectiveType === 'transfer') {
    if (!finalFrom || !finalTo) throw new Error('이체에는 출금/입금 계정이 필요합니다');
    patch.categoryId = null;
  }

  // Cross-entity authorization for referenced entities (after normalization)
  if (patch.categoryId !== undefined && patch.categoryId !== null) {
    const ok = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, patch.categoryId as string), eq(categories.spaceId, spaceId)))
      .limit(1);
    if (!ok[0]) throw new Error('잘못된 카테고리입니다');
  }
  if (patch.fromHoldingId !== undefined && patch.fromHoldingId !== null) {
    const ok = await db
      .select({ id: holdings.id })
      .from(holdings)
      .where(and(eq(holdings.id, patch.fromHoldingId as string), eq(holdings.spaceId, spaceId)))
      .limit(1);
    if (!ok[0]) throw new Error('잘못된 출금 계정입니다');
  }
  if (patch.toHoldingId !== undefined && patch.toHoldingId !== null) {
    const ok = await db
      .select({ id: holdings.id })
      .from(holdings)
      .where(and(eq(holdings.id, patch.toHoldingId as string), eq(holdings.spaceId, spaceId)))
      .limit(1);
    if (!ok[0]) throw new Error('잘못된 입금 계정입니다');
  }

  const [row] = await db
    .update(transactions)
    .set(patch)
    .where(and(eq(transactions.id, id), eq(transactions.spaceId, spaceId)))
    .returning({ id: transactions.id });
  return row;
};

export const deleteTransaction = async (slug: string, id: string) => {
  const { spaceId } = await assertSpaceAccess(slug);
  const res = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.spaceId, spaceId)))
    .returning({ id: transactions.id });
  return res[0];
};
