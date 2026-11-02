import { expect, test, type Page } from '@playwright/test';
async function openDemo(page: Page) {
  await page.goto('/demo');
  await expect(page.getByRole('button', { name: 'Open Brand website', exact: true })).toBeVisible();
}
test('landing, documentation and playground are navigable', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your app\.\s*Their playground/ })).toBeVisible();
  await page.getByRole('link', { name: 'Build your own', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create a standalone demo' })).toBeAttached();
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Good things in the pipeline.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('create, edit, move, reload, delete and reset a deal', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openDemo(page);
  await page.getByRole('button', { name: 'New deal', exact: true }).click();
  await page.getByLabel('Deal name', { exact: true }).fill('A working demo');
  await page.getByLabel('Company', { exact: true }).fill('Example Studio');
  await page.getByLabel('Value (USD)').fill('5000');
  await page.getByRole('button', { name: 'Create deal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open A working demo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Move A working demo to Qualified', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Qualified deals', exact: true }).getByRole('heading', { name: 'A working demo' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Open A working demo', exact: true }).click();
  await page.getByLabel('Deal name', { exact: true }).fill('Updated demo');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('button', { name: 'Open Updated demo', exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete item', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open Updated demo' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset', exact: false }).click();
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Open / })).toHaveCount(8);
  expect(errors).toEqual([]);
});
test('viewer role rejects UI and direct API mutations', async ({ page }) => {
  await openDemo(page);
  await page.getByLabel('View as', { exact: true }).selectOption('viewer');
  await expect(page.getByRole('button', { name: 'New deal', exact: true })).toBeDisabled();
  const status = await page.evaluate(async () => (await fetch('/api/deals/d1', { method: 'DELETE' })).status);
  expect(status).toBe(403);
  await expect(page.getByRole('button', { name: 'Open Brand website', exact: true })).toBeVisible();
});
test('scenario changes and searches update the visible workspace', async ({ page }) => {
  await openDemo(page);
  await page.getByLabel('Scenario', { exact: true }).selectOption('empty');
  await expect(page.getByRole('button', { name: /^Open / })).toHaveCount(0);
  await page.getByLabel('Scenario', { exact: true }).selectOption('growth');
  await expect(page.getByRole('button', { name: /^Open / })).toHaveCount(12);
  await page.getByRole('textbox', { name: 'Search deals', exact: true }).fill('Orbit');
  await expect(page.getByRole('button', { name: /^Open / })).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(13);
});
test('contacts can be created and deleted', async ({ page, isMobile }) => {
  await openDemo(page);
  if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: /^Contacts/ }).click();
  await page.getByRole('button', { name: 'New contact', exact: true }).click();
  await page.getByLabel('Full name').fill('Demo Person');
  await page.getByLabel('Company', { exact: true }).fill('Example');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Job title').fill('Builder');
  await page.getByRole('button', { name: 'Create contact', exact: true }).click();
  await expect(page.getByRole('row', { name: /Demo Person Example/ })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Demo Person', exact: true }).click();
  await page.getByRole('button', { name: 'Delete item', exact: true }).click();
  await expect(page.getByRole('row', { name: /Demo Person Example/ })).toHaveCount(0);
});
test('unhandled external fetches are blocked and visitors are isolated', async ({ page, browser }) => {
  await openDemo(page);
  let leaked = false;
  await page.context().route('https://example.com/demodock-block-test', route => { leaked = true; return route.fulfill({ body: 'leaked' }); });
  const blocked = await page.evaluate(async () => { try { await fetch('https://example.com/demodock-block-test'); return false; } catch { return true; } });
  expect(blocked).toBe(true); expect(leaked).toBe(false);
  await page.getByLabel('Scenario', { exact: true }).selectOption('empty');
  const other = await browser.newContext(); const otherPage = await other.newPage();
  await otherPage.goto(new URL('/demo', page.url()).href);
  await expect(otherPage.getByRole('button', { name: 'Open Brand website', exact: true })).toBeVisible();
  await other.close();
});
test('tour is keyboard dismissible and the page fits the viewport', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Take a tour' }).click();
  await expect(page.getByRole('region', { name: 'Product tour' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Product tour' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
