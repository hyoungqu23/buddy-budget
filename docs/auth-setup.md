BuddyBudget — Supabase Auth(Google) 설정 가이드

개요

- Google OAuth 로그인을 사용하기 위한 Supabase Auth v2 설정 절차입니다.
- 이 문서는 개발/프로덕션 환경 모두를 대상으로 하며, Next.js App Router + `@supabase/ssr` 조합을 전제로 합니다.

사전 준비

- Supabase 프로젝트(Region/DB 생성 완료)
- Google Cloud Console 접근 권한(프로젝트 생성 가능)

1. Google OAuth 클라이언트 생성

1) Google Cloud Console → OAuth 동의 화면 구성(외부/내부 선택, 앱 이름 등 필수 항목 입력)
2) API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI(개발): `http://localhost:3000/auth/callback`
   - 승인된 리디렉션 URI(프로덕션): `https://<YOUR_DOMAIN>/auth/callback`
3) 발급된 Client ID/Client Secret을 복사합니다.

2. Supabase에서 Google Provider 활성화

1) Supabase Dashboard → Authentication → Providers → Google
2) Client ID / Client Secret 입력 후 활성화(Enable)
3) Authentication → URL configuration에서 Redirect URLs 등록
   - 개발: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://<YOUR_DOMAIN>/auth/callback`
4) (권장) Allow lists에서 허용 도메인/리퍼러를 프로젝트 도메인으로 제한합니다.

2-1. 허용 목록(Whitelist) 상세 설정

- Google Cloud Console
  - OAuth 동의 화면 → Authorized domains: `yourdomain.com`
  - OAuth Client → Authorized JavaScript origins:
    - 개발: `http://localhost:3000`
    - 프로덕션: `https://yourdomain.com`
  - OAuth Client → Authorized redirect URIs:
    - 개발: `http://localhost:3000/auth/callback`
    - 프로덕션: `https://yourdomain.com/auth/callback`

- Supabase Dashboard → Authentication → URL configuration
  - Site URL: `https://yourdomain.com` (프로덕션 기준)
  - Additional Redirect URLs:
    - `http://localhost:3000/auth/callback`
    - `https://yourdomain.com/auth/callback`
  - Allowed Cross-Origin URLs:
    - `http://localhost:3000`
    - `https://yourdomain.com`
  - (환경에 따라 표시) Allowed Redirect URLs/Hosts: 위 콜백 URL만 허용

3. 환경 변수 구성
   레포 루트에 `.env.local`을 생성하고 아래 값을 설정합니다. (민감정보이므로 커밋 금지)

```
NEXT_PUBLIC_SUPABASE_URL="https://<YOUR_SUPABASE_PROJECT>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_KEY>"
NEXT_PUBLIC_OAUTH_CALLBACK="http://localhost:3000/auth/callback"
```

참고

- 프로덕션 배포 시 `NEXT_PUBLIC_OAUTH_CALLBACK`을 도메인 기반 URL로 교체하세요.
- 이 레포에는 예시 파일 `.env.example`이 포함되어 있습니다. 필요시 복사해서 사용하세요: `cp .env.example .env.local`.

4. Next.js 연동 포인트 요약

- 서버/클라이언트 Supabase 클라이언트는 이미 `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`에 구현되어 있습니다.
- OAuth 콜백 라우트는 `/(authentication)` 그룹 내부 경로로 구성됩니다: `/auth/callback`
- 로그인 페이지 경로: `/sign-in` (`src/app/(authentication)/sign-in/page.tsx` 예정)
- 보호 경로 그룹: `(private)` 그룹(`src/app/(private)/**`)으로 구성하며 미들웨어에서 가드 예정

5. 문제 해결 체크리스트

- OAuth 시작 시 “redirect_uri_mismatch”가 발생하면 Supabase와 Google Console의 Redirect URL이 정확히 일치하는지 확인
- 로컬에서 쿠키가 설정되지 않으면 `@supabase/ssr` 쿠키 설정 및 미들웨어 갱신 로직 확인
- 다른 도메인으로의 리다이렉트가 차단되면 허용 도메인/리퍼러 화이트리스트 구성을 확인

6. 최종 점검(체크리스트)

- [ ] Google Provider: Client ID/Secret 입력 및 Enabled 상태
- [ ] Google Console: Authorized domains/JS origins/Redirect URIs 등록
- [ ] Supabase URL configuration: Site URL + Additional Redirects + Allowed CORS 설정
- [ ] `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_OAUTH_CALLBACK` 값 설정
- [ ] 로그인 플로우: `/sign-in` → Google → `/auth/callback` → 스페이스 라우팅 정상 동작

보안 주의사항

- `.env.local`은 절대 커밋하지 않습니다(.gitignore에 포함).
- 오픈 리다이렉트 방지를 위해 콜백 후 리다이렉트 목적지를 화이트리스트 기반으로 제한합니다.
