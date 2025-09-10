'use server';

import { createClient } from '@/lib/supabase/server';
import { buildOAuthRedirect } from '@/lib/auth/url';
import { redirect } from 'next/navigation';

export const signInWithGoogle = async (formData: FormData) => {
  const next = String(formData.get('next') || '');
  const base = process.env.NEXT_PUBLIC_OAUTH_CALLBACK || '/auth/callback';
  const redirectTo = buildOAuthRedirect(base, next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
  redirect(`/sign-in?error=${encodeURIComponent('로그인 URL 생성에 실패했습니다')}`);
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
};
