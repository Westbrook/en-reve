import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Serve production output through the existing isolated workflow server.
test('handbook links and distributed contracts resolve to the advertised content', async ({ page, request }) => {
  await page.goto('/guides.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A shared language for creative applications');
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => (node as HTMLAnchorElement).getAttribute('href')!));
  for (const href of [...new Set(links.filter(href => href.startsWith('/') && !href.startsWith('//')))]) {
    expect((await request.get(href)).ok(), href).toBeTruthy();
  }
  for (const href of links.filter(href => href.startsWith('#'))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  const response = await request.get('/guides/contract-index.json');
  const index = await response.json();
  for (const artifact of [...index.artifacts, ...index.skills]) {
    const bytes = await (await request.get(artifact.href)).body();
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(artifact.sha256);
    expect(bytes.length).toBe(artifact.bytes);
  }
  await page.screenshot({ path: test.info().outputPath('handbook-desktop.png'), fullPage: false });
  for (const skill of index.skills) {
    const authored = await readFile(new URL(`../../../${skill.source}`, import.meta.url));
    expect(await (await request.get(skill.href)).body()).toEqual(authored);
  }
});

test('static content, narrow reading and trusted report navigation', async ({ browser, browserName, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const staticPage = await context.newPage();
  await staticPage.goto(new URL('/guides.html#agents', test.info().project.use.baseURL as string).href);
  await expect(staticPage.getByRole('heading', { name: 'Work with an agent', exact: true })).toBeVisible();
  await expect(staticPage.locator('#progress-return')).toBeHidden();
  await context.close();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/guides.html?progress-report=https://example.invalid/#developers');
  await expect(page.locator('#progress-return')).toHaveAttribute('href', 'http://127.0.0.1:4177/');
  await expect(page.locator('#progress-return')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath('handbook-mobile.png'), fullPage: false });
  const links = page.locator('a[data-preserve-report]');
  for (const href of await links.evaluateAll(nodes => nodes.map(node => (node as HTMLAnchorElement).href))) {
    expect(new URL(href).searchParams.has('progress-report')).toBeTruthy();
  }
  await page.goto('/guides.html');
  await expect(page.locator('#progress-return')).toBeHidden();
  // WebKit on macOS retains its native links-in-Tab-order preference.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('link', { name: 'Skip to handbook' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('copied handbook checkbox policies preserve tentative rollback and asynchronous ownership', async ({ page }) => {
  await page.goto('/guides.html');
  const snippets = await page.locator('pre code').allTextContents();
  await page.goto('/api-examples/data-table.html');
  await page.evaluate(() => customElements.whenDefined('en-checkbox'));
  await page.evaluate(([source, asyncSource]) => {
    const form = document.createElement('form');
    document.body.prepend(form);
    const build = source.replace(/^import .*;\n/gm, '');
    // Execute the exact displayed consumer body, with explicit application policy.
    new Function('applicationAllowsSourceFiles', build)(() => false);
    (window as any).handbookForm = form;
    (window as any).handbookAsync = asyncSource;
  }, snippets.slice(0, 2));
  const checkbox = page.getByRole('checkbox', { name: 'Include source files', exact: true });
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  expect(await page.evaluate(() => new FormData((window as any).handbookForm).has('includeSource'))).toBe(false);
  await page.evaluate(() => {
    const form = (window as any).handbookForm as HTMLFormElement;
    const previous = form.querySelector('en-checkbox')!;
    const field = document.createElement('en-checkbox');
    Object.assign(field, { name: 'includeSource', value: 'yes', label: 'Include source files' });
    previous.replaceWith(field);
    const requests: Array<(value: boolean) => void> = [];
    new Function('field', 'savePreference', 'showSaveError', (window as any).handbookAsync)(field,
      () => new Promise<boolean>(resolve => requests.push(resolve)),
      (error: unknown) => { (window as any).handbookError = String(error); });
    (window as any).handbookRequests = requests;
  });
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await page.evaluate(() => (window as any).handbookRequests[1](true));
  await expect(checkbox).toBeChecked();
  await page.evaluate(() => (window as any).handbookRequests[0](false));
  await expect(checkbox).toBeChecked();
  expect(await page.evaluate(() => new FormData((window as any).handbookForm).get('includeSource'))).toBe('yes');
});
