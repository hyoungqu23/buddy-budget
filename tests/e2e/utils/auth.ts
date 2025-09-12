import type { Page } from '@playwright/test';

/**
 * Ensures the page has an authenticated session.
 * Strategy:
 * 1) Try to visit '/' and detect if redirected to /sign-in
 * 2) If not authenticated, try to load cookies from env E2E_COOKIES (JSON)
 * 3) Apply cookies to the current context and reload
 * 4) Return true if authenticated, false otherwise
 */
export const ensureAuth = async (page: Page) => {
  const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(base + '/');
  if (page.url().includes('/sign-in')) {
    const json = process.env.E2E_COOKIES;
    if (!json) return false;
    try {
      const cookies = JSON.parse(json);
      await page.context().addCookies(
        cookies.map((c: any) => ({
          ...c,
          url: base,
        })),
      );
      await page.goto(base + '/');
      if (page.url().includes('/sign-in')) return false;
      return true;
    } catch {
      return false;
    }
  }
  return true;
};
