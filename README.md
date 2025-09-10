BuddyBudget

- PRD/Task 관리: Vooster AI 연동
- 기술 스택: Next.js 15, TypeScript, TailwindCSS, Supabase, Drizzle ORM, @supabase/ssr

Auth Setup

- Supabase Google OAuth 설정과 환경변수 구성은 `docs/auth-setup.md`를 참고하세요.
- 로컬 개발을 위해 `.env.example`을 복사하여 `.env.local`을 생성하세요.
  - `cp .env.example .env.local`
  - 필수 값: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_OAUTH_CALLBACK`
