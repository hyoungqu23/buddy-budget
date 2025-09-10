BuddyBudget — 테스트 가이드

개요
- 인증/세션/리다이렉션 관련 핵심 로직에 대해 유닛/통합 수준의 테스트와 E2E 스펙을 제공합니다.

도구
- 유닛: Vitest
- E2E: Playwright

설치
1) 패키지 설치
```
pnpm add -D vitest @types/node @playwright/test
```
2) 스크립트
- package.json에 이미 다음 스크립트가 포함되어 있습니다.
```
"test:unit": "vitest run",
"test:unit:watch": "vitest",
"test:e2e": "playwright test"
```

유닛 테스트
- 안전 리다이렉트 유틸: `src/lib/security/__tests__/redirect.test.ts`
- OAuth 콜백 URL 빌더: `src/lib/auth/__tests__/url.test.ts`
실행: `pnpm test:unit`

E2E 테스트
- 설정: `playwright.config.ts`
- 스펙: `tests/e2e/auth.spec.ts`
- 실행 전 서버 기동: `pnpm dev` (또는 배포 환경 `E2E_BASE_URL` 설정)
- 실행: `pnpm test:e2e`

참고
- 실제 Google OAuth는 외부 동작이 포함되어 자동화가 제한적입니다. 기본 리다이렉션/보호 가드 검증을 우선하고, 로그인은 계정/세션 주입 또는 수동 단계를 병행하세요.
- 보안 시나리오(오픈 리다이렉트 차단)는 유틸 테스트에서 커버됩니다.

