import { test, expect, type Page, type Locator } from '@playwright/test';

const open = async (page: Page, mode = 'forced') => {
  await page.goto(`/probes/reference-target/fixture.html?mode=${mode}`);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
};
// Playwright's DOM accessible-name algorithm does not read this IDL list in
// the pinned release. Verify actual reference identity here; CDP below separately
// proves Chromium's computed AX names. Neither establishes spoken AT output.
const expectLabels = (input: Locator, names: string[]) => expect.poll(() => input.evaluate(node =>
  Array.from((node as HTMLInputElement).ariaLabelledByElements ?? [], label => label.textContent),
)).toEqual(names);
test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
});

test('native relationship and unmodified library label remain available', async ({ page }) => {
  await open(page);
  await page.locator('label[for="native-control"]').click();
  await expect(page.locator('#native-control')).toBeFocused();
  await expect(page.locator('#native-control')).toHaveAccessibleName('Native account');
  const input = page.locator('#face input');
  await expect(input).toHaveAccessibleName('Internal account');
  await input.fill('accepted');
  expect(await page.locator('#face-form').evaluate(form => new FormData(form as HTMLFormElement).get('account'))).toBe('accepted');
});

test('forced label fallback gives a non-FACE target an outward name and focus', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => (window as any).referenceProbe.handle.mode)).toBe('fallback');
  const input = page.locator('#plain #control');
  await expectLabels(input, ['External account']);
  await page.locator('#plain-label').click();
  await expect(input).toBeFocused();
  expect(await input.evaluate((node: HTMLInputElement) => node.labels?.length)).toBe(0);
  expect(await page.locator('#plain-label').evaluate((node: HTMLLabelElement) => node.control)).toBeNull();
});

test('fallback tracks text, target changes and removal without stealing author names', async ({ page }) => {
  await open(page);
  const input = page.locator('#plain #control');
  await page.locator('#plain-label').evaluate(node => { node.textContent = 'Renamed account'; });
  await expectLabels(input, ['Renamed account']);
  await page.locator('#plain').evaluate(node => { (node.shadowRoot as any).referenceTarget = 'alternate'; });
  await page.evaluate(() => (window as any).referenceProbe.refresh());
  await expectLabels(input, []);
  const alternate = page.locator('#plain #alternate');
  await expect(alternate).toHaveAccessibleName('Author alternate');
  await page.locator('#plain-label').click();
  await expect(alternate).toBeFocused();
  await page.locator('#plain-label').evaluate(node => node.remove());
  await expect(alternate).toHaveAccessibleName('Author alternate');
});

test('disabled targets do not activate and disposal restores owned naming', async ({ page }) => {
  await open(page);
  const input = page.locator('#plain #control');
  await input.evaluate((node: HTMLInputElement) => { node.disabled = true; });
  await page.locator('#plain-label').click();
  await expect(input).not.toBeFocused();
  await input.evaluate((node: HTMLInputElement) => { node.disabled = false; });
  await page.evaluate(() => (window as any).referenceProbe.dispose());
  await expectLabels(input, []);
  // Disposal restores native Reference Target on supporting engines. It must
  // not disable native activation while removing its own reflected name.
  const state = await page.evaluate(() => ({ mode: (window as any).referenceProbe.handle.mode,
    native: (window as any).referenceProbe.capabilities.surface,
    target: (document.querySelector('#plain')!.shadowRoot as any).referenceTarget }));
  expect(state.mode).toBe('disposed');
  if (state.native) expect(state.target).toBe('control');
});

test('upstream fallback deliberately leaves an isolated FACE external-label name unsupported', async ({ page }, info) => {
  await open(page);
  const input = page.locator('#isolated-face input');
  expect(await page.locator('#isolated-label').evaluate((node: HTMLLabelElement) => node.control?.id)).toBe('isolated-face');
  await expect(input).toHaveAccessibleName('Internal isolated account');
  await page.locator('#isolated-label').click();
  info.annotations.push({ type: 'face-activation-observation', description: JSON.stringify({ focused: await input.evaluate(node => node.matches(':focus')) }) });
  await expect(input).toHaveAccessibleName('Internal isolated account');
  info.annotations.push({ type: 'coverage-limit', description: 'The label adapter excludes FACE hosts; this is a reproduced capability gap, not a successful external-label feature.' });
});

test('late hydration of declarative shadow DOM preserves existing input and draft', async ({ page }) => {
  await open(page, 'late');
  const input = page.locator('#ssr input');
  await input.fill('pre-install draft');
  await input.press('ArrowLeft');
  await input.evaluate(node => { (window as any).savedInput = node; });
  await page.evaluate(() => (window as any).referenceProbe.lateInstall());
  await expectLabels(input, ['Pre-rendered account']);
  await expect(input).toHaveValue('pre-install draft');
  expect(await input.evaluate((node: HTMLInputElement) => ({ same: node === (window as any).savedInput, selection: node.selectionStart }))).toEqual({ same: true, selection: 16 });
  await page.locator('#ssr-label').click();
  await expect(input).toBeFocused();
});

test('automatic setup records native routing separately from fallback behavior', async ({ page }, info) => {
  await open(page, 'automatic');
  const support = await page.evaluate(() => ({ capabilities: (window as any).referenceProbe.capabilities, mode: (window as any).referenceProbe.handle.mode }));
  info.annotations.push({ type: 'reference-target-capability', description: JSON.stringify(support) });
  if (!support.capabilities.surface) expect(support.mode).toBe('fallback');
  else if (!support.capabilities.nullable || !support.capabilities.labels) expect(support.mode).toBe('unsupported');
  else expect(support.mode).toBe('native-unverified');
});

test('Chromium native accessibility tree contains the fallback label', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'CDP native accessibility tree is Chromium-only; other engines retain DOM/ARIA checks.');
  await open(page);
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  const names = (tree: typeof nodes) => tree.filter(node => !node.ignored && node.role?.value === 'textbox').map(node => node.name?.value);
  expect(names(nodes)).toContain('External account');
  expect(names(nodes)).toContain('External FACE account Internal account');
  expect(names(nodes)).toContain('Internal isolated account');
  expect(names(nodes)).not.toContain('External isolated account Internal isolated account');
  await page.locator('#plain-label').evaluate(node => { node.textContent = 'Renamed account'; });
  await expect.poll(async () => names((await session.send('Accessibility.getFullAXTree')).nodes)).toContain('Renamed account');
  await page.locator('#plain-label').evaluate(node => node.remove());
  await expect.poll(async () => names((await session.send('Accessibility.getFullAXTree')).nodes)).not.toContain('Renamed account');
  await info.attach('chromium-native-accessibility.json', { body: JSON.stringify(nodes, null, 2), contentType: 'application/json' });
  await session.detach();
});


test('native forwarding is checked as a relationship, not inferred from a property', async ({ page }, info) => {
  await open(page, 'native');
  const caps = await page.evaluate(() => (window as any).referenceProbe.capabilities);
  info.annotations.push({ type: 'native-reference-target', description: JSON.stringify(caps) });
  test.skip(!caps.surface || !caps.labels, 'Native forwarding absent or partial; forced fallback remains a separate comparison.');
  const input = page.locator('#plain #control');
  expect(await page.locator('#plain-label').evaluate((node: HTMLLabelElement) => node.control?.id)).toBe('plain');
  expect(await input.evaluate((node: HTMLInputElement) => Array.from(node.labels ?? [], label => label.id))).toContain('plain-label');
  await page.locator('#plain-label').click();
  await expect(input).toBeFocused();
  await expect(input).toHaveAccessibleName('External account');
  const face = page.locator('#face input');
  info.annotations.push({ type: 'native-face-labels', description: JSON.stringify(await face.evaluate((node: HTMLInputElement) => Array.from(node.labels ?? [], label => label.textContent))) });
});


test('known upstream gap: replacement label must replace the disconnected naming reference', async ({ page }, info) => {
  await open(page);
  const input = page.locator('#plain #control');
  await expectLabels(input, ['External account']);
  test.fail(true, 'Pinned upstream labels adapter loses ownership when the browser filters a disconnected label from ariaLabelledByElements. Retained as an adoption blocker.');
  info.annotations.push({ type: 'known-upstream-gap', description: 'Reference Target fallback 7d30ef45; label replacement clears the inner name. Do not treat expected failure as support.' });
  await page.locator('#plain-label').evaluate(node => { node.outerHTML = '<label id="plain-label" for="plain">Replacement account</label>'; });
  await expectLabels(input, ['Replacement account']);
});

test('native Chromium accessibility names include forwarded FACE and pre-rendered labels', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Only Chromium exposes the native AX protocol here.');
  await open(page, 'native');
  const caps = await page.evaluate(() => (window as any).referenceProbe.capabilities);
  test.skip(!caps.labels, 'Native Reference Target label routing absent.');
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  const names = nodes.filter(node => !node.ignored && node.role?.value === 'textbox').map(node => node.name?.value);
  expect(names).toContain('External account');
  expect(names).toContain('External FACE account Internal account');
  expect(names).toContain('Pre-rendered account');
  await info.attach('native-forwarding-accessibility.json', { body: JSON.stringify(nodes, null, 2), contentType: 'application/json' });
  await session.detach();
});
