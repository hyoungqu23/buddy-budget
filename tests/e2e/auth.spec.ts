import { expect, test } from '@playwright/test';

test.describe('Auth flow', () => {
  test('unauthenticated redirect to /sign-in', async ({ page }) => {
    await page.goto('/post-sign-in');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('logout prevents access (manual)', async () => {
    // 로그인은 실제 OAuth 연동이 필요하여 E2E에서는 수동/모의 계정으로 수행하세요.
    // 1) 로그인 후 보호 페이지 접근 가능 확인
    // 2) 로그아웃 버튼 클릭
    // 3) 보호 페이지 재접근 시 /sign-in 리다이렉트 확인
  });
});
