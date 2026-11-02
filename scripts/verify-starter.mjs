// Run against the built starter's preview server (default port 4174).
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.STARTER_URL || 'http://127.0.0.1:4174');
  await expect(page.getByText('Make yourself at home', { exact: true })).toBeVisible();
  await page.getByLabel('New task').fill('Ship this starter');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const checkbox = page.getByRole('checkbox', { name: 'Ship this starter', exact: true });
  await expect(checkbox).toBeVisible();
  // The controlled checkbox updates after its HTTP response, so await that state.
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await page.reload();
  await expect(checkbox).toBeChecked();
  await page.getByLabel('View as', { exact: true }).selectOption('viewer');
  await expect(page.getByRole('button', { name: 'Add task', exact: true })).toBeDisabled();
  await page.getByLabel('Scenario', { exact: true }).selectOption('empty');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log('Starter smoke passed: startup, add, toggle, refresh, viewer, and scenario.');
} finally { await browser.close(); }
