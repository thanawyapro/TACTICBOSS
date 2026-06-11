import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const mime: Record<string,string> = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json'
};

async function serveDist(page: Page) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const candidate = path.normalize(path.join(dist, pathname));
    if (!candidate.startsWith(dist) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) return route.fulfill({ status: 404, body: 'Not found' });
    const ext = path.extname(candidate);
    return route.fulfill({ status: 200, contentType: mime[ext] || 'application/octet-stream', body: fs.readFileSync(candidate) });
  });
}

test.describe('public production smoke', () => {
  test.beforeEach(async ({ page }) => { await serveDist(page); });

  test('mobile login screen is usable and guest access is absent', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Tactic Boss AI/);
    await expect(page.getByText('Tactic Boss AI').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText(/الدخول كضيف|Continue as guest/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /الخصوصية|Privacy/i })).toBeVisible();
    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('service worker'))).toEqual([]);
  });

  test('signup requires password confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /إنشاء حساب|Create Account/i }).click();
    await expect(page.getByText(/تأكيد كلمة المرور|Confirm Password/i)).toBeVisible();
    await expect(page.locator('input[autocomplete="new-password"]')).toHaveCount(2);
  });

  test('policy and deletion files are present and valid', async () => {
    for (const file of ['privacy.html', 'terms.html', 'delete-account.html', 'manifest.json', 'offline.html']) {
      expect(fs.existsSync(path.join(dist,file)), `${file} should exist`).toBeTruthy();
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(dist,'manifest.json'),'utf8'));
    expect(manifest.name).toBe('Tactic Boss AI');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('desktop login layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
  });
});
