import { test, expect, type Page } from '@playwright/test';

const open = async (page: Page, native = false) => {
  await page.goto('/probes/reference-target/owned-fixture.html' + (native ? '?native' : ''));
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
};
const names = (page: Page) => page.locator('#owned input').evaluate(node =>
  Array.from((node as HTMLInputElement).ariaLabelledByElements ?? [], label => label.id || label.getAttribute('part')));
const formValue = (page: Page) => page.locator('#form').evaluate(form => new FormData(form as HTMLFormElement).get('account'));

test.beforeEach(async ({ browser }, info) => info.annotations.push({ type: 'browser-version', description: browser.version() }));

test('owned FACE bridge preserves label identity, native editing, reset and transactional cancellation', async ({ page }) => {
  await open(page);
  const input = page.locator('#owned input');
  await expect.poll(() => names(page)).toEqual(['external', 'label']);
  await page.locator('#external').click({ position: { x: 10, y: 8 } });
  await expect(input).toBeFocused();
  await input.fill('accepted');
  expect(await formValue(page)).toBe('accepted');
  await page.locator('#owned').evaluate(host => {
    (window as any).notices = [];
    host.addEventListener('en-input', () => (window as any).notices.push('input'));
    host.addEventListener('en-change', event => event.preventDefault());
  });
  await input.fill('draft');
  await expect(input).toHaveValue('draft');
  expect(await formValue(page)).toBe('accepted');
  // fill() produces engine-specific native input sequences. Reset must not add
  // an editing notification; it need not erase valid notifications from fill().
  const notices = await page.evaluate(() => (window as any).notices);
  expect(notices.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('server value');
  expect(await formValue(page)).toBe('server value');
  expect(await page.evaluate(() => (window as any).notices)).toEqual(notices);
});

test('owned bridge replaces removed labels, tracks retargeting and preserves the internal slot', async ({ page }, info) => {
  await open(page);
  await expect.poll(() => names(page)).toEqual(['external', 'label']);
  await page.locator('#external').evaluate(label => { label.outerHTML = '<label id="replacement" for="owned">Replacement account</label>'; });
  await expect.poll(() => names(page)).toEqual(['replacement', 'label']);
  await page.locator('#owned').evaluate(host => { host.innerHTML = '<span slot="label">Slotted account</span>'; });
  await page.locator('#replacement').evaluate(label => { label.setAttribute('for', 'elsewhere'); });
  await info.attach('retarget-relationships.json', { body: JSON.stringify(await page.locator('#owned').evaluate((host: any) => ({
    labels: Array.from(host.labels, (label: any) => ({ id: label.id, for: label.htmlFor, control: label.control?.id })),
    inputName: host.shadowRoot.querySelector('input').getAttribute('aria-labelledby'),
    references: Array.from(host.shadowRoot.querySelector('input').ariaLabelledByElements ?? [], (node: any) => node.id || node.getAttribute('part')),
  }))), contentType: 'application/json' });
  await expect.poll(() => names(page)).toEqual([]);
  await expect(page.locator('#owned input')).toHaveAccessibleName('Slotted account');
  await page.locator('#replacement').evaluate(label => { label.setAttribute('for', 'owned'); });
  await expect.poll(() => names(page)).toEqual(['replacement', 'label']);
});

test('explicit native names supersede owned references and are retained at teardown', async ({ page }) => {
  await open(page);
  const input = page.locator('#owned input');
  await expect.poll(() => names(page)).toEqual(['external', 'label']);
  await input.evaluate(node => { node.setAttribute('aria-label', 'Author name'); ((node.getRootNode() as ShadowRoot).host as any).requestUpdate(); });
  await expect.poll(() => names(page)).toEqual([]);
  await expect(input).toHaveAccessibleName('Author name');
  await input.evaluate(node => { node.removeAttribute('aria-label'); ((node.getRootNode() as ShadowRoot).host as any).requestUpdate(); });
  await expect.poll(() => names(page)).toEqual(['external', 'label']);
  await input.evaluate(node => {
    const label = document.createElement('span'); label.id = 'author-label'; label.textContent = 'Author reference';
    node.getRootNode().appendChild(label);
    node.setAttribute('aria-labelledby', 'author-label');
    ((node.getRootNode() as ShadowRoot).host as any).requestUpdate();
  });
  await expect(input).toHaveAccessibleName('Author reference');
  await page.locator('#owned').evaluate(host => { (window as any).detachedOwned = host; host.remove(); });
  expect(await page.evaluate(() => (window as any).detachedOwned.shadowRoot.querySelector('input').getAttribute('aria-labelledby'))).toBe('author-label');
});

test('wrapping labels and two external labels remain distinct real-node references', async ({ page }) => {
  await open(page);
  await page.locator('#owned').evaluate(host => {
    const wrapper = document.createElement('label'); wrapper.id = 'wrapper';
    wrapper.append('Wrapped account'); host.before(wrapper); wrapper.append(host);
  });
  await expect.poll(() => names(page)).toEqual(['external', 'wrapper', 'label']);
  await page.locator('#wrapper').click({ position: { x: 10, y: 8 } });
  await expect(page.locator('#owned input')).toBeFocused();
  await page.locator('#external').evaluate(label => label.remove());
  await expect.poll(() => names(page)).toEqual(['wrapper', 'label']);
});

test('known Firefox gap: FACE labels must stop listing a retargeted label', async ({ page, browserName }, info) => {
  await open(page);
  await page.locator('#external').evaluate(label => { label.outerHTML = '<label id="replacement" for="owned">Replacement account</label>'; });
  await expect.poll(() => names(page)).toEqual(['replacement', 'label']);
  await page.locator('#owned').evaluate(host => { host.innerHTML = '<span slot="label">Slotted account</span>'; });
  await page.locator('#replacement').evaluate(label => { label.setAttribute('for', 'elsewhere'); });
  expect(await page.locator('#replacement').evaluate((label: HTMLLabelElement) => label.control)).toBeNull();
  test.fail(browserName === 'firefox', 'Firefox 155 retains a retargeted label in ElementInternals.labels. The bridge independently verifies label.control.');
  info.annotations.push({ type: 'capability-limit', description: 'Raw FACE labels liveness; not the bridge result. An unexpected pass requires reviewing the browser qualification.' });
  await expect.poll(() => page.locator('#owned').evaluate((host: any) => Array.from(host.labels, (label: any) => label.id))).toEqual([]);
});

test('label activation respects links, disabled fieldsets and cancellation by ancestors', async ({ page }) => {
  await open(page);
  const input = page.locator('#owned input');
  await page.locator('#outside').focus();
  await page.getByRole('link', { name: 'Help', exact: true }).click();
  await expect(page).toHaveURL(/#destination$/);
  await expect(input).not.toBeFocused();
  await page.locator('#owned').evaluate(host => { const fieldset = document.createElement('fieldset'); fieldset.disabled = true; host.before(fieldset); fieldset.append(host); });
  await expect(input).toBeDisabled();
  await page.locator('#external').click({ position: { x: 10, y: 8 } });
  await expect(input).not.toBeFocused();
  await page.locator('fieldset').evaluate(node => { (node as HTMLFieldSetElement).disabled = false; });
  await expect(input).toBeEnabled();
  await page.locator('body').evaluate(body => body.addEventListener('click', event => event.preventDefault()));
  await page.locator('#external').click({ position: { x: 10, y: 8 } });
  // Flush the controller's task after the whole dispatch; checking immediately
  // would make an asynchronously stolen focus look like a successful no-op.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 30)));
  await expect(input).not.toBeFocused();
});

test('disconnect and reconnect switch label roots without retaining the old association', async ({ page }) => {
  await open(page);
  await page.locator('#owned').evaluate(host => { (window as any).detachedOwned = host; host.remove(); });
  expect(await page.evaluate(() => (window as any).detachedOwned.shadowRoot.querySelector('input').getAttribute('aria-labelledby'))).toBeNull();
  await page.evaluate(() => {
    const wrapper = document.createElement('section'); document.body.append(wrapper);
    const root = wrapper.attachShadow({ mode: 'open' });
    root.innerHTML = '<label id="new-root" for="owned">Root account</label>';
    root.append((window as any).detachedOwned);
  });
  await expect.poll(() => names(page)).toEqual(['new-root', 'label']);
  await page.locator('#new-root').click();
  await expect(page.locator('#owned input')).toBeFocused();
});

test('native Reference Target takes precedence without installing reflected names', async ({ page }) => {
  await open(page, true);
  const native = await page.locator('#owned').evaluate(host => (host.shadowRoot as any).referenceTarget === 'control');
  const input = page.locator('#owned input');
  if (native) {
    await expect.poll(() => names(page)).toEqual([]);
    expect(await input.evaluate((node: HTMLInputElement) => Array.from(node.labels ?? [], label => label.id || label.getAttribute('part')))).toEqual(['external', 'label']);
  } else await expect.poll(() => names(page)).toEqual(['external', 'label']);
  await page.locator('#external').click({ position: { x: 10, y: 8 } });
  await expect(input).toBeFocused();
});

test('real SSR hydration preserves the input, live draft, selection and form ownership', async ({ page }) => {
  await page.goto('/probes/reference-target/owned-ssr.html');
  const input = page.locator('#owned input');
  await input.fill('pre-hydration draft');
  await input.press('ArrowLeft');
  await input.evaluate(node => { (window as any).originalInput = node; });
  await page.locator('#hydrate').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('body')).toHaveAttribute('data-hydrated', 'true');
  await expect(input).toHaveValue('pre-hydration draft');
  await expect(input).toBeFocused();
  expect(await input.evaluate((node: HTMLInputElement) => ({ same: node === (window as any).originalInput, selection: node.selectionStart }))).toEqual({ same: true, selection: 18 });
  // The pre-hydration draft stays a draft until the native acceptance boundary.
  await input.press('Enter');
  expect(await formValue(page)).toBe('pre-hydration draft');
  await page.locator('#external').click();
  await expect(input).toBeFocused();
});

test('Chromium AX names survive replacement, slot changes and native SSR hydration', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Native AX protocol only; other engines verify IDL relationships and interaction, not speech.');
  await open(page);
  const session = await page.context().newCDPSession(page);
  const axNames = async () => (await session.send('Accessibility.getFullAXTree')).nodes
    .filter(node => !node.ignored && node.role?.value === 'textbox').map(node => node.name?.value);
  await expect.poll(axNames).toContain('External account Help Internal account');
  await page.locator('#external').evaluate(label => { label.outerHTML = '<label id="replacement" for="owned">Replacement account</label>'; });
  await page.locator('#owned').evaluate(host => { host.innerHTML = '<span slot="label">Slotted account</span>'; });
  await expect.poll(axNames).toContain('Replacement account Slotted account');
  await page.goto('/probes/reference-target/owned-ssr.html');
  await expect.poll(axNames).toContain('Server account Internal account');
  await page.locator('#hydrate').click();
  await expect(page.locator('body')).toHaveAttribute('data-hydrated', 'true');
  await expect.poll(axNames).toContain('Server account Internal account');
  await info.attach('owned-labels-native-ax.json', { body: JSON.stringify((await session.send('Accessibility.getFullAXTree')).nodes, null, 2), contentType: 'application/json' });
  await session.detach();
});
