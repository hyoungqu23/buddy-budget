'use server';

import { db } from '@/db/client';
import { members } from '@/db/schema/members';
import { spaces } from '@/db/schema/spaces';
import { slugify } from '@/lib/slug';
import { createClient } from '@/lib/supabase/server';
import { updateSpaceSchema, type UpdateSpaceGeneralInput } from '@/lib/validation/space';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const getCurrentUserId = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
};

export const getMySpaces = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [] as { id: string; name: string; slug: string }[];

  const rows = await db
    .select({ id: spaces.id, name: spaces.name, slug: spaces.slug })
    .from(members)
    .leftJoin(spaces, eq(members.spaceId, spaces.id))
    .where(eq(members.userId, userId));

  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
};

export const createSpace = async (formData: FormData) => {
  const name = String(formData.get('name') || '').trim();
  if (!name) {
    throw new Error('Space name is required');
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // generate unique slug with transaction and retries on conflict
  let lastError = null;
  for (let i = 0; i < 5; i++) {
    const slug = slugify(name);
    try {
      const result = await db.transaction(async (tx) => {
        const [sp] = await tx
          .insert(spaces)
          .values({ name, slug, ownerId: userId })
          .returning({ id: spaces.id, slug: spaces.slug });
        await tx.insert(members).values({ spaceId: sp.id, userId, role: 'owner' });
        return sp;
      });
      redirect(`/${result.slug}`);
    } catch (e) {
      lastError = e;
      const msg = String(e instanceof Error ? e.message : e);
      if (
        msg.includes('spaces_slug_unique') ||
        msg.includes('duplicate key') ||
        msg.includes('unique')
      ) {
        continue;
      }
      break;
    }
  }
  throw new Error(
    'Failed to create space' +
      (lastError ? `: ${String(lastError instanceof Error ? lastError.message : lastError)}` : ''),
  );
};

export const assertSpaceAccess = async (slug: string) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select({ id: spaces.id, slug: spaces.slug })
    .from(spaces)
    .leftJoin(members, eq(members.spaceId, spaces.id))
    .where(and(eq(spaces.slug, slug), eq(members.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row?.id) throw new Error('Space not found or no access');
  return { spaceId: row.id, slug: row.slug };
};

export const updateSpaceGeneral = async (currentSlug: string, input: UpdateSpaceGeneralInput) => {
  const parsed = updateSpaceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  const data = parsed.data;

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select({ id: spaces.id })
    .from(spaces)
    .leftJoin(members, eq(members.spaceId, spaces.id))
    .where(and(eq(spaces.slug, currentSlug), eq(members.userId, userId)))
    .limit(1);
  if (!rows[0]?.id) throw new Error('권한이 없습니다');

  try {
    const [updated] = await db
      .update(spaces)
      .set({ name: data.name, slug: data.slug })
      .where(eq(spaces.id, rows[0].id))
      .returning({ slug: spaces.slug });

    if (!updated) throw new Error('업데이트에 실패했습니다');
    if (updated.slug !== currentSlug) {
      redirect(`/${updated.slug}`);
    }
    return updated;
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (msg.includes('spaces_slug_unique') || msg.includes('duplicate key')) {
      throw new Error('이미 사용 중인 슬러그입니다');
    }
    throw e;
  }
};
