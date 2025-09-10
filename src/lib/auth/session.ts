import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Returns the current Supabase session on the server.
 * Safe to call from Server Components, Route Handlers, and Server Actions.
 */
export const getSession = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

/**
 * Returns the current user or null if unauthenticated.
 */
export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
};

/**
 * Enforces authentication on server side. If no user, redirects to `/sign-in`.
 * Optionally accepts a `next` path to round-trip after sign-in.
 */
export const requireUser = async (next?: string) => {
  const user = await getUser();
  if (!user) {
    const qs = next ? `?next=${encodeURIComponent(next)}` : '';
    redirect(`/sign-in${qs}`);
  }
  return user;
};
