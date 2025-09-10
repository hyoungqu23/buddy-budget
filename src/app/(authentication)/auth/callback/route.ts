import { getMySpaces } from '@/app/actions/space';
import { db } from '@/db/client';
import { profiles } from '@/db/schema/profiles';
import { isSafeInternalPath } from '@/lib/security/redirect';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');

  if (error) {
    // 사용자 취소(access_denied) 또는 기타 오류 코드 처리
    const message =
      error === 'access_denied' ? '사용자가 로그인을 취소했습니다' : `OAuth 오류: ${error}`;
    redirect(`/sign-in?error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    redirect(`/sign-in?error=${encodeURIComponent('유효하지 않은 콜백 요청입니다')}`);
  }

  const supabase = await createClient();

  // Supabase가 내부적으로 state/PKCE 검증 및 쿠키 설정을 수행합니다.
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!);
  if (exchangeError) {
    redirect(`/sign-in?error=${encodeURIComponent(exchangeError.message)}`);
  }

  // 로그인 성공: 사용자 정보 동기화(upsert)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (!userErr && userData.user) {
    const u = userData.user;
    const meta = u.user_metadata || {};
    const name =
      typeof meta.name === 'string'
        ? meta.name
        : typeof meta.full_name === 'string'
          ? meta.full_name
          : null;
    const avatarUrl = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;

    // upsert by user_id unique key
    await db
      .insert(profiles)
      .values({ userId: u.id, name, avatarUrl })
      .onConflictDoUpdate({
        target: [profiles.userId],
        set: { name, avatarUrl },
      });
  }

  // next가 안전하면 우선 사용
  if (isSafeInternalPath(next)) {
    redirect(next!);
  }

  // 보유한 스페이스가 있으면 첫 번째 스페이스로 이동
  const spaces = await getMySpaces();
  if (spaces.length > 0) {
    redirect(`/${spaces[0]!.slug}`);
  }

  // 없으면 /home에서 생성 UI 렌더
  redirect('/home');
};
