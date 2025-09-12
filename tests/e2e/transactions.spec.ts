import { expect, test } from '@playwright/test';
import { ensureAuth } from './utils/auth';

test.describe('Transactions page', () => {
  test('filters, infinite scroll, CRUD flow', async ({ page }) => {
    const slug = process.env.E2E_SPACE_SLUG || 'your-space-slug';
    const ok = await ensureAuth(page);
    if (!ok) test.skip(true, '로그인 세션이 필요합니다');
    await page.goto(`/${slug}/transactions`);

    // 검색/필터
    await page.getByPlaceholder('메모 검색').fill('테스트');
    await expect(page).toHaveURL(/transactions/);

    // 생성
    await page.selectOption('select[name="type"]', 'expense');
    await page.fill('input[name="amount"]', '1234.56');
    await page.fill('input[name="occurredAt"]', '2025-01-01T12:00');
    // 선택 요소들은 프로젝트 데이터에 맞춰 수정 필요
    // await page.selectOption('select[name="categoryId"]', '...');
    // await page.selectOption('select[name="fromHoldingId"]', '...');
    await page.getByRole('button', { name: '추가' }).click();

    // 무한 스크롤
    await page.mouse.wheel(0, 2000);

    // 삭제 (첫 항목)
    // await page.getByRole('button', { name: '삭제' }).first().click();
    // await page.getByRole('button', { name: '확인' }).click();
  });
});
