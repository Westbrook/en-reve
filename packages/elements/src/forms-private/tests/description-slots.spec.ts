import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fileURLToPath } from 'node:url';

const fixture = `/@fs${fileURLToPath(new URL('./description-slots.html', import.meta.url))}`;
const families = [
  ['en-text-field', 'control'], ['en-textarea', 'control'], ['en-search-input', 'control'],
  ['en-date-input', 'control'], ['en-select', 'control'], ['en-number-field', 'control'],
  ['en-color-field', 'control'], ['en-checkbox', 'control'], ['en-switch', 'control'],
  ['en-radio', 'control'], ['en-radio-group', 'radiogroup'], ['en-segmented-control', 'group'],
  ['en-slider', 'slider'], ['en-rating', 'group'],
] as const;

async function mount(page: Page, markup: string) {
  await page.locator('#fixture').evaluate(async (main, content) => {
    main.innerHTML = content;
    for (const host of main.querySelectorAll('en-select,en-segmented-control')) {
      (host as any).items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
      (host as any).value = 'a';
    }
    const elements = [...main.querySelectorAll('*')].filter(element => customElements.get(element.localName));
    await Promise.all(elements.map(element => (element as any).updateComplete));
    await Promise.all(elements.map(element => (element as any).updateComplete));
  }, markup);
}

function describedTarget(host: Locator, kind: typeof families[number][1]) {
  return kind === 'control' ? host.locator('[part~="control"]') : host.getByRole(kind, { name: 'Setting', exact: true });
}

async function description(host: Locator, value: string | null) {
  await host.evaluate(async (element, text) => {
    if (text === null) element.removeAttribute('description');
    else element.setAttribute('description', text);
    await (element as any).updateComplete;
  }, value);
}

async function assignDescription(host: Locator, value: string) {
  await host.evaluate((element, text) => {
    const node = document.createElement('span');
    node.slot = 'description'; node.textContent = text; element.append(node);
  }, value);
}

test.beforeEach(async ({ page, browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('all fourteen families preserve semantic names while slot descriptions replace and restore text fallbacks', async ({ page }) => {
  for (const [tag, kind] of families) await test.step(tag, async () => {
    const children = tag === 'en-radio-group' ? '<en-radio value="a" checked>Alpha</en-radio><en-radio value="b">Beta</en-radio>' : '';
    await mount(page, `<${tag} id="subject" label="Setting" value="0">${children}</${tag}>`);
    const host = page.locator('#subject');
    const target = describedTarget(host, kind);
    await expect(target).toHaveAccessibleName('Setting');
    await expect(target).toHaveAccessibleDescription('');
    const baseline = await host.boundingBox();
    expect(baseline).not.toBeNull();
    await description(host, 'Attribute help.');
    await expect(target).toHaveAccessibleDescription('Attribute help.');
    await expect(host.getByText('Attribute help.', { exact: true })).toBeVisible();
    expect((await host.boundingBox())!.height).toBeGreaterThan(baseline!.height + 1);
    await assignDescription(host, 'Slotted help.');
    await expect(target).toHaveAccessibleDescription('Slotted help.');
    await expect(host.locator(':scope > [slot="description"]')).toBeVisible();
    expect((await host.boundingBox())!.height).toBeGreaterThan(baseline!.height + 1);
    await expect(target).toHaveAccessibleName('Setting');
    await description(host, 'Updated fallback.');
    await expect(target).toHaveAccessibleDescription('Slotted help.');
    const assigned = host.locator(':scope > [slot="description"]');
    // Text mutation does not cause slotchange: the accessible description must follow actual DOM content.
    await assigned.evaluate(element => { element.textContent = 'Revised slotted help.'; });
    await expect(target).toHaveAccessibleDescription('Revised slotted help.');
    await assigned.evaluate(element => { (element as HTMLElement).hidden = true; });
    await expect(assigned).toBeHidden();
    await expect(target).toHaveAccessibleDescription('');
    expect(Math.abs((await host.boundingBox())!.height - baseline!.height)).toBeLessThanOrEqual(1);
    await assigned.evaluate(element => { (element as HTMLElement).hidden = false; });
    await expect(target).toHaveAccessibleDescription('Revised slotted help.');
    await assigned.evaluate(element => { element.setAttribute('slot', 'unmatched-description'); });
    await expect(target).toHaveAccessibleDescription('Updated fallback.');
    await host.locator(':scope > [slot="unmatched-description"]').evaluate(element => { element.setAttribute('slot', 'description'); });
    await expect(target).toHaveAccessibleDescription('Revised slotted help.');
    await assigned.evaluate(element => { element.textContent = ''; });
    await expect(target).toHaveAccessibleDescription('');
    await assigned.evaluate(element => element.remove());
    await expect(target).toHaveAccessibleDescription('Updated fallback.');
    await description(host, null);
    await expect(target).toHaveAccessibleDescription('');
    expect(Math.abs((await host.boundingBox())!.height - baseline!.height)).toBeLessThanOrEqual(1);
    await assignDescription(host, 'Slot-only help.');
    await expect(target).toHaveAccessibleDescription('Slot-only help.');
  });
});

test('a light-DOM-empty assigned custom element retains its visible shadow description', async ({ page }) => {
  await mount(page, `<en-text-field id="subject" label="Project name" description="Fallback must not replace shadow help.">
    <test-description-help slot="description"></test-description-help>
  </en-text-field>`);
  const host = page.locator('#subject');
  const input = host.locator('[part~="control"]');
  const assigned = host.locator('test-description-help');
  expect(await assigned.evaluate(element => element.textContent)).toBe('');
  await expect(assigned).toBeVisible();
  await expect(input).toHaveAccessibleDescription('Guidance from a shadow tree.');
  await assigned.evaluate(element => { (element as any).message = 'Revised shadow guidance.'; });
  await expect(input).toHaveAccessibleDescription('Revised shadow guidance.');
  await expect(input).toHaveAccessibleName('Project name');
});

test('label activation and a description link remain independent keyboard interactions', async ({ page, browserName }) => {
  await mount(page, `<en-text-field id="subject" label="Fallback name" description="Fallback help.">
    <span slot="label">Project name</span>
    <span slot="description">Use a recognizable name. <a href="#naming-guide">Naming guidance</a></span>
  </en-text-field><button type="button">After the field</button><h2 id="naming-guide">Naming guidance destination</h2>`);
  const input = page.locator('#subject [part~="control"]');
  await expect(input).toHaveAccessibleName('Project name');
  await expect(input).toHaveAccessibleDescription('Use a recognizable name. Naming guidance');
  await page.locator('#subject > [slot="label"]').click();
  await expect(input).toBeFocused();
  // WebKit on macOS uses Option+Tab to include links under the default keyboard preference.
  const next = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await input.press(next);
  const link = page.getByRole('link', { name: 'Naming guidance', exact: true });
  await expect(link).toBeFocused();
  const destination = new URL('#naming-guide', page.url()).href;
  await link.press('Enter');
  await expect(page).toHaveURL(destination);
  await link.focus();
  await link.press(next);
  await expect(page.getByRole('button', { name: 'After the field', exact: true })).toBeFocused();
  await expect(input).toHaveAccessibleName('Project name');
  const audit = await new AxeBuilder({ page }).include('#fixture').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(audit.violations).toEqual([]);
});

test('changing help preserves the focused text draft, native input identity and associated validation error', async ({ page }) => {
  await mount(page, `<form><en-text-field id="subject" name="project" label="Project name" value="Accepted project" error="Choose a unique project name.">
    <span slot="description">Shared with collaborators.</span>
  </en-text-field></form>`);
  const host = page.locator('#subject');
  await host.evaluate(element => element.addEventListener('en-change', event => event.preventDefault()));
  const input = host.locator('[part~="control"]');
  await input.fill('Unaccepted project draft');
  await input.evaluate(element => {
    (window as any).__descriptionInput = element;
    (element as HTMLInputElement).setSelectionRange(2, 9);
  });
  await expect(input).toHaveAccessibleDescription('Shared with collaborators. Choose a unique project name.');
  await host.locator(':scope > [slot="description"]').evaluate(element => { element.textContent = 'Only your team can see this.'; });
  await expect(input).toHaveAccessibleDescription('Only your team can see this. Choose a unique project name.');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(host.locator('[part~="error"]')).toBeVisible();
  await expect(input).toHaveValue('Unaccepted project draft');
  expect(await input.evaluate(element => ({
    identical: element === (window as any).__descriptionInput,
    selection: [(element as HTMLInputElement).selectionStart, (element as HTMLInputElement).selectionEnd],
  }))).toEqual({ identical: true, selection: [2, 9] });
  await expect(input).toBeFocused();
  expect(await page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).get('project'))).toBe('Accepted project');
  await host.locator(':scope > [slot="description"]').evaluate(element => element.remove());
  await expect(input).toHaveAccessibleDescription('Choose a unique project name.');
  await expect(input).toBeFocused();
  await input.press('X');
  await expect(input).toHaveValue('UnXd project draft');
});

test('the exact slider editor retains its invalid draft and error while both native controls receive updated help', async ({ page }) => {
  await mount(page, `<form><en-slider id="subject" name="opacity" label="Opacity" editable min="0" max="100" step="1" value="64" validation-text="Choose a whole number from 0 to 100.">
    <span slot="label">Opacity</span>
    <span slot="description">Percentage of the image to show.</span>
  </en-slider></form>`);
  const host = page.locator('#subject');
  const range = host.getByRole('slider', { name: 'Opacity', exact: true });
  const editor = host.getByRole('spinbutton', { name: 'Opacity Exact value', exact: true });
  await expect(range).toHaveAccessibleDescription('Percentage of the image to show.');
  await expect(editor).toHaveAccessibleDescription('Percentage of the image to show.');
  await editor.fill('101');
  await editor.press('Enter');
  await editor.evaluate(element => { (window as any).__descriptionEditor = element; });
  await expect(editor).toHaveAccessibleDescription('Percentage of the image to show. Choose a whole number from 0 to 100.');
  await host.locator(':scope > [slot="description"]').evaluate(element => { element.textContent = 'The original image remains available.'; });
  await expect(range).toHaveAccessibleDescription('The original image remains available.');
  await expect(editor).toHaveAccessibleDescription('The original image remains available. Choose a whole number from 0 to 100.');
  await expect(editor).toHaveValue('101');
  await expect(editor).toHaveAttribute('aria-invalid', 'true');
  await expect(editor).toBeFocused();
  expect(await editor.evaluate(element => element === (window as any).__descriptionEditor)).toBe(true);
  expect(await host.evaluate(element => (element as any).value)).toBe(64);
  expect(await page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).get('opacity'))).toBe('64');
  await host.locator(':scope > [slot="description"]').evaluate(element => element.remove());
  await expect(range).toHaveAccessibleDescription('');
  await expect(editor).toHaveAccessibleDescription('Choose a whole number from 0 to 100.');
  await editor.fill('72');
  await editor.press('Enter');
  expect(await host.evaluate(element => (element as any).value)).toBe(72);
  await expect(editor).not.toHaveAttribute('aria-invalid', 'true');
});
