import { test, expect, type Page } from '@playwright/test';

const item = (page: Page, id: string) => page.locator(`#${id} > [part="base"]`);
async function hydrate(page: Page, replay = true) {
  await page.evaluate(replay => (window as any).hydrateTreeFixture(replay), replay);
  await expect(page.locator('html')).toHaveAttribute('data-tree-hydrated', 'true');
}

test('tree hierarchy, selection and collapsed groups are correct before JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4197/tree');
    await expect(page.getByRole('tree', { name: 'Project files' })).toBeVisible();
    await expect(item(page, 'source')).toHaveAttribute('aria-expanded', 'true');
    await expect(item(page, 'readme')).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, 'readme')).toHaveAttribute('tabindex', '0');
    await expect(item(page, 'readme')).toHaveAttribute('aria-level', '2');
    await expect(item(page, 'readme')).not.toHaveAttribute('aria-expanded');
    await expect(item(page, 'old')).toBeHidden();
    await expect(page.locator('#rich-label')).toBeVisible();
  } finally { await context.close(); }
});

test('hydration retains semantic nodes, label and focus then supports parent-authoritative updates', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tree');
  await page.evaluate(() => {
    const row = document.getElementById('readme')!.shadowRoot!.querySelector<HTMLElement>('[role="treeitem"]')!;
    (window as any).originalTreeNodes = { row, group: document.getElementById('source')!.shadowRoot!.querySelector('[role="group"]'), label: document.getElementById('rich-label') };
    row.focus();
  });
  await hydrate(page);
  expect(await page.evaluate(() => {
    const originals = (window as any).originalTreeNodes;
    return originals.row === document.getElementById('readme')!.shadowRoot!.querySelector('[role="treeitem"]')
      && originals.group === document.getElementById('source')!.shadowRoot!.querySelector('[role="group"]')
      && originals.label === document.getElementById('rich-label')
      && document.getElementById('readme')!.shadowRoot!.activeElement === originals.row;
  })).toBe(true);
  await expect(page.locator('[data-en-tree-presentation], [data-en-tree-snapshot]')).toHaveCount(0);
  await page.evaluate(() => { (document.getElementById('tree') as any).expanded = ['archive']; });
  await expect(item(page, 'readme')).toBeHidden();
  await expect(item(page, 'old')).toBeVisible();
  await page.evaluate(() => { (document.getElementById('tree') as any).value = 'old'; });
  await expect(item(page, 'old')).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('standalone upgrade restores property-only expansion and reconciles pre-hydration item changes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tree');
  await page.evaluate(() => {
    document.getElementById('tests')!.setAttribute('hidden', '');
    (window as any).preHydrationReadme = document.getElementById('readme')!.shadowRoot!.querySelector('[role="treeitem"]');
  });
  await hydrate(page, false);
  await expect(item(page, 'source')).toHaveAttribute('aria-expanded', 'true');
  await expect(item(page, 'readme')).toHaveAttribute('aria-setsize', '1');
  expect(await page.evaluate(() => (window as any).preHydrationReadme === document.getElementById('readme')!.shadowRoot!.querySelector('[role="treeitem"]'))).toBe(true);
  expect(errors).toEqual([]);
});

test('data tree renders a bounded hierarchical first window before JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4197/tree');
    const tree = page.getByRole('tree', { name: 'Virtual data files' });
    const row = tree.getByRole('treeitem', { name: 'Asset 0', exact: true });
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute('aria-level', '2');
    await expect(row).toHaveAttribute('aria-setsize', '80');
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await expect(tree.getByRole('treeitem', { name: 'Assets', exact: true }).getByRole('group')).toContainText('Asset 0');
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(40);
  } finally { await context.close(); }
});

for (const replay of [true, false]) {
  test(`data hydration ${replay ? 'with property replay' : 'as standalone DSD'} retains first-window rows and restores the full model`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/tree');
    await page.evaluate(() => {
      const root = document.getElementById('data-tree')!.shadowRoot!;
      (window as any).dataRowsBefore = [...root.querySelectorAll('[role="treeitem"]')].slice(0, 2);
    });
    await hydrate(page, replay);
    expect(await page.evaluate(() => {
      const tree = document.getElementById('data-tree') as any;
      return tree.items[0].children.length === 80
        && (window as any).dataRowsBefore.every((row: Element) => row.isConnected);
    })).toBe(true);
    await expect(page.locator('#data-tree')).not.toHaveAttribute('data-en-tree-data');
    expect(await page.evaluate(async () => {
      const tree = document.getElementById('data-tree') as any;
      return tree.scrollToKey('asset-70', { block: 'center', behavior: 'instant' });
    })).toBe(true);
    await expect(page.getByRole('treeitem', { name: 'Asset 70', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const replay of [true, false]) test(`canonical authored keys keep node identity during ${replay ? 'template replay' : 'standalone upgrade'}`, async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tree');
  const row = item(page,'canonical-child');
  await expect(row).toHaveAttribute('aria-selected','true');
  await row.evaluate(node => { (window as any).canonicalNode=node; });
  await hydrate(page,replay);
  expect(await row.evaluate(node => node===(window as any).canonicalNode)).toBe(true);
  const tree=page.locator('#canonical-tree');
  await expect(tree).toHaveJSProperty('selectedKey','canonical-child');
  await expect(tree).toHaveJSProperty('expandedKeys',['canonical-folder']);
  await tree.evaluate((tree:any)=>tree.removeAttribute('selected-key'));
  await expect(tree).toHaveJSProperty('selectedKey','');
  await expect(row).toHaveAttribute('aria-selected','false');
  expect(errors).toEqual([]);
});
