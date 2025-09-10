'use server';

import { assertSpaceAccess } from '@/app/actions/space';
import { db } from '@/db/client';
import { holdings } from '@/db/schema/holdings';
import { CreatedAtIdCursor, decodeCursor, encodeCursor } from '@/lib/cursor';
import {
  HoldingCreateInput,
  HoldingUpdateInput,
  holdingCreateSchema,
  holdingUpdateSchema,
} from '@/lib/validation/holdings';
import { and, desc, eq, ilike, lt, or } from 'drizzle-orm';

type ListParams = {
  slug: string;
  limit?: number;
  cursor?: string | null;
  q?: string;
  type?: 'bank' | 'card' | 'cash' | 'etc';
};

export const listInfiniteHoldings = async (params: ListParams) => {
  const { slug, q, type } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

  const { spaceId } = await assertSpaceAccess(slug);

  let cursorCond;
  if (params.cursor) {
    const c = decodeCursor<CreatedAtIdCursor>(params.cursor);
    const createdAt = new Date(c.createdAt);
    cursorCond = or(
      lt(holdings.createdAt, createdAt),
      and(eq(holdings.createdAt, createdAt), lt(holdings.id, c.id)),
    );
  }

  let whereCond = eq(holdings.spaceId, spaceId);
  if (cursorCond) whereCond = and(whereCond, cursorCond);
  if (q && q.trim()) whereCond = and(whereCond, ilike(holdings.name, `%${q.trim()}%`));
  if (type) whereCond = and(whereCond, eq(holdings.type, type));

  const rows = await db
    .select({
      id: holdings.id,
      name: holdings.name,
      type: holdings.type,
      color: holdings.color,
      currency: holdings.currency,
      openingBalance: holdings.openingBalance,
      createdAt: holdings.createdAt,
    })
    .from(holdings)
    .where(whereCond)
    .orderBy(desc(holdings.createdAt), desc(holdings.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? encodeCursor<CreatedAtIdCursor>({
        createdAt: items[items.length - 1].createdAt.toISOString(),
        id: items[items.length - 1].id,
      })
    : null;

  return { items, nextCursor };
};

export const createHolding = async (slug: string, input: HoldingCreateInput) => {
  const parsed = holdingCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);
  try {
    const insertValue: typeof holdings.$inferInsert = {
      spaceId,
      name: data.name,
      type: data.type,
      color: data.color,
      currency: data.currency ?? 'KRW',
      openingBalance: data.openingBalance.toFixed(2),
    };
    const [row] = await db.insert(holdings).values(insertValue).returning({ id: holdings.id });
    return row;
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes('u_holdings_space_name') || msg.includes('duplicate key')) {
      throw new Error('이미 존재하는 이름입니다');
    }
    throw e;
  }
};

export const updateHolding = async (slug: string, id: string, input: HoldingUpdateInput) => {
  const parsed = holdingUpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);
  const patch: Partial<typeof holdings.$inferInsert> = {
    ...data,
    openingBalance: data.openingBalance?.toFixed(2),
  };
  const [row] = await db
    .update(holdings)
    .set(patch)
    .where(and(eq(holdings.id, id), eq(holdings.spaceId, spaceId)))
    .returning({ id: holdings.id });
  return row;
};

export const deleteHolding = async (slug: string, id: string) => {
  const { spaceId } = await assertSpaceAccess(slug);
  const res = await db
    .delete(holdings)
    .where(and(eq(holdings.id, id), eq(holdings.spaceId, spaceId)))
    .returning({ id: holdings.id });
  return res[0];
};
