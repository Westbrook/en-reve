import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function collectErrors(page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function computedBox(page) {
  return page.locator('.measured').evaluate(element => {
    const style = getComputedStyle(element);
    return { width: style.width, padding: style.paddingInlineStart, border: style.borderInlineStartWidth, color: style.color };
  });
}

test('production minification preserves SSR drafts, hydration identity, binding offsets and computed CSS', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/minification-assets/entry.js', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/minification-fixture', { waitUntil: 'commit' });
    const title = page.getByRole('textbox', { name: 'Draft title', exact: true });
    const notes = page.getByRole('textbox', { name: 'Draft notes', exact: true });
    await expect(notes).toHaveValue('\nFirst line\nA second line & details');
    await title.fill('Early title & details');
    await notes.fill('\nEarly notes\n\tPreserved draft');
    await notes.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(2, 9));
    const titleNode = await title.elementHandle();
    const notesNode = await notes.elementHandle();
    const before = await computedBox(page);
    expect(before).toEqual({ width: '116px', padding: '14px', border: '3px', color: 'rgb(17, 34, 51)' });
    release();
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    expect(await title.evaluate((element, original) => element === original, titleNode)).toBe(true);
    expect(await notes.evaluate((element, original) => element === original, notesNode)).toBe(true);
    await expect(title).toHaveValue('Early title & details');
    await expect(notes).toHaveValue('\nEarly notes\n\tPreserved draft');
    await expect(notes).toBeFocused();
    expect(await notes.evaluate((element: HTMLTextAreaElement) => [element.selectionStart, element.selectionEnd])).toEqual([2, 9]);
    expect(await page.locator('#draft-form').evaluate((form: HTMLFormElement) => Object.fromEntries(new FormData(form)))).toEqual({ title: 'Early title & details', notes: '\nEarly notes\n\tPreserved draft' });
    expect(await computedBox(page)).toEqual(before);

    const alpha = page.getByRole('button', { name: 'Choose Alpha', exact: true });
    const alphaNode = await alpha.elementHandle();
    await expect(alpha).toHaveAttribute('title', 'two "quotes" & one \'apostrophe\' / alpha');
    await expect(alpha).toHaveAttribute('data-single', 'Alpha & two "quotes" & one \'apostrophe\'');
    await expect(alpha).toBeEnabled();
    await alpha.click();
    await expect(page.locator('#selected')).toHaveText('alpha');
    await page.getByRole('button', { name: 'Advance fixture', exact: true }).click();
    expect(await alpha.evaluate((element, original) => element === original, alphaNode)).toBe(true);
    await expect(page.locator('[data-key]').first()).toHaveAttribute('data-key', 'beta');
    await expect(alpha).toBeDisabled();
    await expect(alpha).toHaveAttribute('title', 'updated "quoted" & value / alpha');
    await expect(page.locator('en-minifier-probe')).toHaveJSProperty('payload', { id: 'beta' });
    await expect(page.locator('en-minifier-probe span')).toHaveText('beta');
    await page.getByRole('button', { name: 'Choose Beta', exact: true }).press('Enter');
    await expect(page.locator('#selected')).toHaveText('beta');
    await expect(page.locator('#dynamic-style')).toHaveCSS('width', '54px');
    await expect(page.getByRole('textbox', { name: 'Slash guard' })).toHaveValue('path/');
    await expect(notes).toHaveValue('\nEarly notes\n\tPreserved draft');

    await page.getByRole('checkbox', { name: 'Large CSS unit' }).uncheck();
    expect(await computedBox(page)).toEqual({ width: '112px', padding: '10px', border: '3px', color: 'rgb(17, 34, 51)' });
    await page.locator('html').evaluate(element => { element.dir = 'rtl'; });
    await expect(page.locator('en-minifier-probe span')).toHaveCSS('padding-right', '7px');
    await expect(page.locator('en-minifier-probe > b')).toHaveCSS('color', 'rgb(9, 87, 65)');
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await expect(page.locator('.measured')).toHaveCSS('color', 'rgb(221, 238, 255)');
    const modern = await page.locator('#modern-select').evaluate(element => ({
      supported: CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'),
      appearance: getComputedStyle(element).appearance,
    }));
    expect(modern.appearance).toBe(modern.supported ? 'base-select' : 'auto');
    await page.getByRole('combobox', { name: 'Modern select' }).selectOption({ label: 'Second' });
    await expect(page.getByRole('combobox', { name: 'Modern select' })).toHaveValue('Second');
    await testInfo.attach('computed-production-css', { body: JSON.stringify({ before, modern, errors }, null, 2), contentType: 'application/json' });
    expect(errors).toEqual([]);
  } finally { release(); }
});

test('production minification retains inline gaps, inherited pre-wrap, textarea newline and highlighted raw source', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  const authoredSource = await readFile(new URL('../minification/template.mjs', import.meta.url), 'utf8');
  await page.goto('/minification-fixture');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.locator('#inline-words')).toHaveText('Before middle after Alpha done.');
  expect(await page.locator('#inline-words').evaluate(element => element.textContent)).toBe('Before middle after Alpha done.');
  await page.getByRole('button', { name: 'Advance fixture', exact: true }).click();
  expect(await page.locator('#inline-words').evaluate(element => element.textContent)).toBe('Before middle after Beta done.');
  expect(await page.locator('#preserved-text').evaluate(element => element.textContent)).toBe('first  second\n\tthird   fourth');
  await expect(page.locator('#preserved-text')).toHaveCSS('white-space', 'pre-wrap');
  expect(await page.locator('#literal-code code').evaluate(element => element.textContent)).toBe('first  second\n\tthird <tag>');
  await expect(page.getByRole('textbox', { name: 'Literal notes' })).toHaveValue('\nfirst\n\tsecond');
  const code = page.locator('#source pre > code');
  expect(await code.textContent()).toBe(authoredSource);
  await page.getByText('View fixture source', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#source')).toHaveAttribute('open', '');
  await expect(page.locator('#source')).toHaveAttribute('data-highlighted', 'true');
  expect(await code.textContent()).toBe(authoredSource);
  const highlight = await code.evaluate((element, authoredSource) => {
    // Selection.toString() follows rendered-text rules; Chromium can omit the
    // final line feed even when the text node and selected Range retain it.
    // Compare a separately constructed native reference under the same styles.
    const referencePre = document.createElement('pre');
    const referenceCode = document.createElement('code');
    referenceCode.className = element.className;
    referenceCode.textContent = authoredSource;
    referencePre.append(referenceCode);
    element.parentElement.after(referencePre);
    const selection = window.getSelection();
    const select = node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges(); selection.addRange(range);
      return { rangeText: range.toString(), selected: selection.toString() };
    };
    try {
      const reference = select(referenceCode);
      const actual = select(element);
      return { actual, reference, highlights: CSS.highlights?.size ?? 0, children: element.childNodes.length };
    } finally { referencePre.remove(); }
  }, authoredSource);
  expect(highlight.actual.rangeText).toBe(authoredSource);
  expect(highlight.reference.rangeText).toBe(authoredSource);
  expect(highlight.actual.selected).toBe(highlight.reference.selected);
  expect(highlight.children).toBe(1);
  expect(highlight.highlights).toBeGreaterThan(0);
  await testInfo.attach('preserved-source', { body: JSON.stringify({
    bytes: Buffer.byteLength(authoredSource), highlights: highlight.highlights,
    selectedCharacters: highlight.actual.selected.length,
    nativeReferenceSelectedCharacters: highlight.reference.selected.length,
    sourceCharacters: authoredSource.length, errors,
  }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
