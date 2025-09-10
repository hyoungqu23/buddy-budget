'use server';

import { db } from '@/db/client';
import { members } from '@/db/schema/members';
import { spaces } from '@/db/schema/spaces';
import { slugify } from '@/lib/slug';
import { createClient } from '@/lib/supabase/server';
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
  let lastError: unknown = null;
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
    } catch (e: any) {
      lastError = e;
      const msg = String(e?.message || '');
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
      (lastError ? `: ${String((lastError as any)?.message || lastError)}` : ''),
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
