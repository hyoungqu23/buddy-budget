'use server';

import { assertSpaceAccess } from '@/app/actions/space';
import { db } from '@/db/client';
import { categories } from '@/db/schema/categories';
import { CreatedAtIdCursor, decodeCursor, encodeCursor } from '@/lib/cursor';
import {
  CategoryCreateInput,
  CategoryUpdateInput,
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@/lib/validation/categories';
import { and, desc, eq, ilike, lt, or } from 'drizzle-orm';

type ListParams = {
  slug: string;
  limit?: number;
  cursor?: string | null;
  q?: string;
  kind?: 'expense' | 'income';
};

export const listInfiniteCategories = async (params: ListParams) => {
  const { slug, q, kind } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

  const { spaceId } = await assertSpaceAccess(slug);

  let cursorCond;
  if (params.cursor) {
    const c = decodeCursor<CreatedAtIdCursor>(params.cursor);
    const createdAt = new Date(c.createdAt);
    cursorCond = or(
      lt(categories.createdAt, createdAt),
      and(eq(categories.createdAt, createdAt), lt(categories.id, c.id)),
    );
  }

  const filters = [eq(categories.spaceId, spaceId)];
  if (cursorCond) filters.push(cursorCond);
  if (q && q.trim()) filters.push(ilike(categories.name, `%${q.trim()}%`));
  if (kind) filters.push(eq(categories.kind, kind));

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      kind: categories.kind,
      color: categories.color,
      icon: categories.icon,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(and(...filters))
    .orderBy(desc(categories.createdAt), desc(categories.id))
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

export const createCategory = async (slug: string, input: CategoryCreateInput) => {
  const parsed = categoryCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const { spaceId } = await assertSpaceAccess(slug);
  try {
    const [row] = await db
      .insert(categories)
      .values({
        spaceId,
        name: data.name,
        kind: data.kind,
        color: data.color,
        icon: data.icon === '' ? undefined : data.icon,
      })
      .returning({ id: categories.id });
    return row;
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes('u_categories_space_name') || msg.includes('duplicate key')) {
      throw new Error('이미 존재하는 이름입니다');
    }
    throw e;
  }
};

export const updateCategory = async (slug: string, id: string, input: CategoryUpdateInput) => {
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');

  const { spaceId } = await assertSpaceAccess(slug);
  try {
    const [row] = await db
      .update(categories)
      .set({ ...parsed.data })
      .where(and(eq(categories.id, id), eq(categories.spaceId, spaceId)))
      .returning({ id: categories.id });
    return row;
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes('u_categories_space_name') || msg.includes('duplicate key')) {
      throw new Error('이미 존재하는 이름입니다');
    }
    throw e;
  }
};

export const deleteCategory = async (slug: string, id: string) => {
  const { spaceId } = await assertSpaceAccess(slug);
  // TODO: 참조 무결성(거래 존재) 체크는 트랜잭션/후속 구현에서 보강
  const res = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.spaceId, spaceId)))
    .returning({ id: categories.id });
  return res[0];
};
