"use server";

import { db } from "@/db/client";
import { spaceMembers, spaces } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
    .from(spaceMembers)
    .leftJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
    .where(eq(spaceMembers.userId, userId));

  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
};

export const createSpace = async (formData: FormData) => {
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    throw new Error("Space name is required");
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // generate unique slug (basic retry)
  let slug = slugify(name);
  for (let i = 0; i < 3; i++) {
    try {
      const [sp] = await db
        .insert(spaces)
        .values({ name, slug, ownerId: userId })
        .returning({ id: spaces.id, slug: spaces.slug });
      await db
        .insert(spaceMembers)
        .values({ spaceId: sp.id, userId, role: "owner" });
      redirect(`/${sp.slug}`);
    } catch (e) {
      // collision -> retry with new slug
      slug = slugify(name);
    }
  }
  throw new Error("Failed to create space");
};
