import {test, expect, type Page} from '@playwright/test';
const editor = (page: Page, index = 0) => page.locator(`#editor-${index}`);
const toolbar = (page: Page, index = 0) => page.locator(`#toolbar-${index}`);
const control = (page: Page, index = 0) => editor(page, index).getByRole('textbox');
const base = (page: Page, index = 0) => toolbar(page, index).locator('[part~=base][popover=manual]');
async function open(page: Page, mode: string, boundary = 'ordinary') {
  await page.goto(`/index.html?boundary=${boundary}${mode === 'global' ? '&global' : ''}`);
  await page.waitForFunction(() => Boolean((window as any).editorFixture));
  for (let index = 0; index < 2; index++) await expect(control(page, index)).toHaveAttribute('contenteditable', 'true');
  await page.evaluate(() => (window as any).editorFixture.capture());
}
async function select(page: Page, index = 0, backward = false) {
  await control(page, index).scrollIntoViewIfNeeded();
  await page.evaluate(({index, backward}) => (window as any).editorFixture.select(index, backward), {index, backward});
  await expect(editor(page, index)).toHaveJSProperty('hasSelection', true);
}
async function link(page: Page) {
  await select(page); await expect(base(page)).toBeVisible();
  await toolbar(page).getByRole('button', {name: 'Link', exact: true}).click();
  const field = toolbar(page).getByRole('textbox', {name: 'Link URL'}); await expect(field).toBeFocused(); return field;
}
test.beforeEach(({page}) => {const errors: string[] = []; (page as any).editorErrors = errors; page.on('pageerror', error => errors.push(error.message));});
test.afterEach(({page}) => expect((page as any).editorErrors).toEqual([]));

for (const mode of ['auto', 'global']) for (const boundary of ['ordinary', 'shadow', 'nested']) {
  test(`${mode}/${boundary}: eager sibling controls retain their owning registry and selection visibility`, async ({page}, info) => {
    await open(page, mode, boundary);
    const initial = await page.evaluate(() => (window as any).editorFixture.state());
    expect(initial.actual).toBe(mode === 'global' || !initial.nativeCapability ? 'global' : 'scoped');
    expect(initial.entries.map((entry: any) => entry.controls)).toEqual([1, 1]);
    expect(initial.globalLeak).toBe(false);
    await expect(base(page)).not.toBeVisible();
    await expect(base(page, 1)).not.toBeVisible();
    await select(page, 0, true); await expect(base(page)).toBeVisible();
    await expect(base(page, 1)).not.toBeVisible();
    const shown = await page.evaluate(() => (window as any).editorFixture.state());
    expect(shown.entries.map((entry: any) => entry.controls)).toEqual([1, 1]);
    expect(shown.entries.every((entry: any) => entry.sameEditor && entry.ownedConstructors)).toBe(true);
    await toolbar(page).getByRole('button', {name: 'Bold', exact: true}).click();
    await expect(editor(page).locator('strong')).toHaveText('Alpha beta gamma');
    await expect(editor(page, 1).locator('strong')).toHaveCount(0);
    await toolbar(page).getByRole('button', {name: 'Undo', exact: true}).click();
    await expect(editor(page).locator('strong')).toHaveCount(0);
    await info.attach('registry-mode', {body: JSON.stringify({requested: mode, actual: shown.actual, boundary, sharedRegistry: true}), contentType: 'application/json'});
  });
}

for (const mode of ['auto', 'global']) {
  test(`${mode}: link cancellation and author revisions preserve the live editor and invalidate stale targets`, async ({page}) => {
    await open(page, mode);
    const field = await link(page); await field.fill('https://example.com/canceled');
    await page.keyboard.press('Escape'); await expect(control(page)).toBeFocused(); await expect(base(page)).not.toBeVisible();
    await expect(editor(page).locator('a')).toHaveCount(0);
    await editor(page).evaluate((host: any) => host.value = 'A fresh target');
    const next = await link(page); await next.fill('https://example.com/stale');
    await editor(page).evaluate((host: any) => host.value = 'Author replacement');
    await expect(toolbar(page).getByRole('textbox', {name: 'Link URL'})).toHaveCount(0);
    await expect(editor(page)).toHaveJSProperty('value', 'Author replacement');
    await expect(editor(page).locator('a')).toHaveCount(0);
    expect((await page.evaluate(() => (window as any).editorFixture.state())).entries.every((entry: any) => entry.sameEditor)).toBe(true);
  });

  test(`${mode}: cancelable commands and retained controls preserve ownership across presentation updates`, async ({page}) => {
    await open(page, mode); await select(page); await expect(base(page)).toBeVisible();
    await editor(page).evaluate((host: any) => host.addEventListener('en-change', (event: Event) => event.preventDefault(), {once: true}));
    await toolbar(page).getByRole('button', {name: 'Bold', exact: true}).click(); await expect(editor(page).locator('strong')).toHaveCount(0);
    const field = await link(page); await field.fill('https://example.com/draft');
    const identity = await toolbar(page).evaluate(async (host: any) => {
      const commands = host.shadowRoot.querySelector('en-toolbar'), field = host.shadowRoot.querySelector('en-text-field');
      host.placement = 'docked'; await host.updateComplete; host.placement = 'floating'; await host.updateComplete;
      return {commands: commands === host.shadowRoot.querySelector('en-toolbar'), field: field === host.shadowRoot.querySelector('en-text-field')};
    });
    expect(identity).toEqual({commands: true, field: true}); await expect(field).toHaveValue('https://example.com/draft');
    await toolbar(page).getByRole('button', {name: 'Apply link'}).click(); await expect(editor(page).locator('a')).toHaveText('Alpha beta gamma');
  });

  test(`${mode}: readonly, disabled and synthetic composition keep contextual controls hidden`, async ({page}) => {
    await open(page, mode);
    await editor(page).evaluate((host: any) => host.readOnly = true);
    await expect(control(page)).toHaveAttribute('contenteditable', 'false'); await control(page).click({clickCount: 3});
    await expect(editor(page)).toHaveJSProperty('hasSelection', true);
    await expect(toolbar(page).locator('en-toolbar')).toHaveCount(1); await expect(base(page)).not.toBeVisible();
    expect(await editor(page).evaluate((host: any) => host.execute('bold'))).toBe(false);
    await editor(page).evaluate((host: any) => {host.readOnly = false; host.disabled = true;});
    await expect(control(page)).toHaveAttribute('tabindex', '-1'); await expect(toolbar(page).locator('en-toolbar')).toHaveCount(1); await expect(base(page)).not.toBeVisible();
    await page.evaluate(() => {
      const f = (window as any).editorFixture; f.entries[0].toolbar.remove();
      f.entries[0].editor.disabled = false; f.entries[0].editor.value = 'Composition draft'; f.entries[0].editor.focus();
    });
    await expect(control(page)).toHaveAttribute('contenteditable', 'true'); await select(page);
    await control(page).dispatchEvent('compositionstart');
    expect(await editor(page).evaluate((host: any) => host.composing)).toBe(true);
    await expect(editor(page)).toHaveJSProperty('hasSelection', true);
    await page.evaluate(async () => {const f = (window as any).editorFixture, entry = f.entries[0]; entry.root.append(entry.toolbar); await entry.toolbar.updateComplete;});
    expect(await editor(page).evaluate((host: any) => host.execute('bold'))).toBe(false);
    await expect(toolbar(page).locator('en-toolbar')).toHaveCount(1); await expect(base(page)).not.toBeVisible();
    await editor(page).evaluate((host: any) => host.value = 'After composition'); await control(page).dispatchEvent('compositionend');
    await expect(editor(page)).toHaveJSProperty('value', 'After composition');
    await select(page); await expect(base(page)).toBeVisible();
    expect((await page.evaluate(() => (window as any).editorFixture.state())).entries[0].sameEditor).toBe(true);
  });

  test(`${mode}: disconnect and retarget release link drafts and preserve editor ownership`, async ({page}) => {
    await open(page, mode, 'nested'); const field = await link(page); await field.fill('https://example.com/old');
    await page.evaluate(() => (window as any).editorFixture.reconnect(0));
    await expect(toolbar(page).getByRole('textbox', {name: 'Link URL'})).toHaveCount(0);
    await expect(base(page)).not.toBeVisible();
    await page.evaluate(() => {const f = (window as any).editorFixture; f.entries[1].toolbar.remove(); return f.retarget(0, 1);});
    await editor(page).evaluate((host: any) => host.value = 'Old owner changed');
    await select(page, 1); await expect(base(page)).toBeVisible();
    await toolbar(page).getByRole('button', {name: 'Bold', exact: true}).click();
    await expect(editor(page, 1).locator('strong')).toHaveText('Alpha beta gamma');
    await expect(editor(page).locator('strong')).toHaveCount(0);
    expect((await page.evaluate(() => (window as any).editorFixture.state())).entries[0].sameEditor).toBe(true);
  });

  test(`${mode}: removal cancels queued toolbar focus and keeps the native fallback usable`, async ({page}) => {
    await open(page, mode); await select(page); await expect(base(page)).toBeVisible();
    await page.evaluate(async () => {
      const f = (window as any).editorFixture, toolbar = f.entries[0].toolbar;
      toolbar.focus(); toolbar.remove(); document.querySelector<HTMLInputElement>('#essential')!.focus();
      await toolbar.updateComplete;
    });
    await expect(page.locator('#essential')).toBeFocused();
    await page.locator('#essential').fill('Draft after removal');
    await expect(page.locator('#essential')).toHaveValue('Draft after removal');
    expect((await page.evaluate(() => (window as any).editorFixture.state())).entries[0].sameEditor).toBe(true);
  });

  test(`${mode}: removal during real selection notification preserves newer focus and retained controls`, async ({page}) => {
    await open(page, mode);
    const removed = await page.evaluate(async () => {
      const f = (window as any).editorFixture, {editor, toolbar} = f.entries[0];
      await new Promise<void>(resolve => {
        const detach = () => {
          if (!editor.hasSelection) return;
          editor.removeEventListener('en-editor-state', detach); toolbar.remove();
          document.querySelector<HTMLInputElement>('#essential')!.focus(); resolve();
        };
        editor.addEventListener('en-editor-state', detach); f.select(0);
      });
      await toolbar.updateComplete;
      return {selected: editor.hasSelection, connected: toolbar.isConnected, controls: toolbar.shadowRoot.querySelectorAll('en-toolbar').length};
    });
    expect(removed).toEqual({selected: true, connected: false, controls: 1});
    await expect(page.locator('#essential')).toBeFocused();
    await page.evaluate(async () => {const entry = (window as any).editorFixture.entries[0]; entry.root.append(entry.toolbar); await entry.toolbar.updateComplete;});
    await expect(toolbar(page).locator('en-toolbar')).toHaveCount(1); await expect(base(page)).not.toBeVisible();
    await select(page); await expect(base(page)).toBeVisible();
    await expect(toolbar(page).locator('en-toolbar')).toHaveCount(1);
  });
}

test('adopting a used toolbar into another real document releases the old link target and focus', async ({page}) => {
  await open(page, 'global'); const field = await link(page); await field.fill('https://example.com/old-document');
  await page.evaluate(() => {const iframe = document.createElement('iframe'); iframe.id = 'adoption-frame'; iframe.src = '/index.html?global'; document.body.append(iframe);});
  const frame = page.frameLocator('#adoption-frame');
  await expect(frame.locator('#editor-0').getByRole('textbox')).toHaveAttribute('contenteditable', 'true');
  await page.evaluate(async () => {
    const source = (window as any).editorFixture, iframe = document.querySelector<HTMLIFrameElement>('#adoption-frame')!, target = (iframe.contentWindow as any).editorFixture;
    const toolbar = source.entries[0].toolbar; toolbar.remove(); target.entries[0].toolbar.remove(); toolbar.editor = target.entries[0].editor; toolbar.id = 'adopted-toolbar';
    iframe.contentDocument!.body.append(toolbar); await toolbar.updateComplete;
    source.entries[0].editor.value = 'Original document changed';
    document.querySelector<HTMLInputElement>('#essential')!.focus();
  });
  await expect(frame.locator('#adopted-toolbar').getByRole('textbox', {name: 'Link URL'})).toHaveCount(0);
  await expect(page.locator('#essential')).toBeFocused();
  await expect(frame.locator('#adopted-toolbar').locator('[part~=base][popover=manual]')).not.toBeVisible();
  await expect(editor(page).locator('a')).toHaveCount(0);
  await expect(frame.locator('#editor-0').locator('a')).toHaveCount(0);
  await frame.locator('#editor-0').evaluate(() => (window as any).editorFixture.select(0));
  await expect(frame.locator('#adopted-toolbar').getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
  await frame.locator('#adopted-toolbar').getByRole('button', {name: 'Bold', exact: true}).click();
  await expect(frame.locator('#editor-0').locator('strong')).toHaveText('Alpha beta gamma');
  await expect(editor(page).locator('strong')).toHaveCount(0);
});

for (const mode of ['auto', 'global']) {
  test(`${mode}: closed containing roots retain generated and authored focus and release newer focus owners`, async ({page}, info) => {
    await open(page, mode);
    await page.evaluate(async () => {
      const f = (window as any).editorFixture;
      f.entries[0].toolbar.remove();
      const host = f.scope.createElement('section'); document.querySelector('#editors')!.append(host);
      const root = f.scope.attachShadow(host, {mode: 'closed'});
      const toolbar = f.scope.createElement('en-editor-toolbar');
      toolbar.mode = 'contextual';
      toolbar.commands = ['bold', 'italic']; toolbar.editor = f.entries[0].editor;
      const input = f.scope.createElement('input'); input.value = 'Private outside draft';
      root.append(toolbar, input); await toolbar.updateComplete;
      const deepActive = () => {let node = root.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node;};
      f.closed = {host, root, toolbar, input, deepActive};
      f.closed.state = () => {
        const c = f.closed, surface = toolbar.shadowRoot.querySelector('[part~="base"][popover="manual"]');
        const generated = toolbar.shadowRoot.querySelector('en-button:not([disabled])');
        const focused = deepActive();
        return {
          closed: host.shadowRoot === null,
          focus: focused === c.native ? 'native' : focused === c.custom?.shadowRoot?.querySelector('button') ? 'custom' : focused === generated?.shadowRoot?.querySelector('button') ? 'generated' : focused === input ? 'private-input' : 'outside',
          open: surface.matches(':popover-open'),
          visible: surface.getClientRects().length > 0 && getComputedStyle(surface).visibility !== 'hidden',
          documentStopsAtClosedHost: document.activeElement === host,
          controls: toolbar.shadowRoot.querySelectorAll('en-toolbar').length,
          actualRegistry: f.scope.mode,
          owned: [...toolbar.shadowRoot.querySelectorAll('en-toolbar,en-button,en-icon')].every((node: any) => node.constructor === f.scope.get(node.localName)),
        };
      };
    });
    const initial = await page.evaluate(() => (window as any).editorFixture.closed.state());
    expect(initial).toMatchObject({closed: true, open: false, controls: 1, owned: true});
    await select(page);
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().open)).toBe(true);
    const before = await page.evaluate(() => {
      const f = (window as any).editorFixture, editor = f.entries[0].editor;
      f.closed.editorSnapshot = () => ({range: editor.captureRange(), key: editor.selectionKey, value: editor.value, revision: editor.revision, sameLive: editor.shadowRoot.querySelector('[contenteditable]') === f.entries[0].live});
      f.closed.nativeNode = f.entries[0].live.querySelector('p').firstChild;
      const snapshot = (native: Selection | null) => {
        if (!native) throw new Error('Expected a native editor selection.');
        return {text: native.toString(), anchorOffset: native.anchorOffset, focusOffset: native.focusOffset, sameAnchor: native.anchorNode === f.closed.nativeNode, sameFocus: native.focusNode === f.closed.nativeNode};
      };
      // Observe exact shadow endpoints and native direction independently. A
      // document Selection may expose retargeted anchor/focus nodes after focus.
      f.closed.nativeSnapshot = () => {
        const native = editor.ownerDocument.getSelection();
        if (!native || typeof native.getComposedRanges !== 'function' || !('direction' in native)) throw new Error('Expected native composed selection and direction support.');
        const ranges = native.getComposedRanges({shadowRoots: [editor.shadowRoot]});
        if (ranges.length !== 1) throw new Error('Expected exactly one native composed range.');
        const range = ranges[0], copy = editor.ownerDocument.createRange();
        copy.setStart(range.startContainer, range.startOffset); copy.setEnd(range.endContainer, range.endOffset);
        return {text: native.toString(), rangeText: copy.toString(), startOffset: range.startOffset, endOffset: range.endOffset, sameStart: range.startContainer === f.closed.nativeNode, sameEnd: range.endContainer === f.closed.nativeNode, collapsed: range.collapsed, direction: native.direction};
      };
      f.closed.documentSnapshot = () => snapshot(editor.ownerDocument.getSelection());
      return {editor: f.closed.editorSnapshot(), native: f.closed.nativeSnapshot(), documentNative: f.closed.documentSnapshot()};
    });
    await info.attach('closed-toolbar-native-selection-baseline', {body: JSON.stringify(before), contentType: 'application/json'});
    expect(before.native).toEqual({text: 'Alpha beta gamma', rangeText: 'Alpha beta gamma', startOffset: 0, endOffset: 16, sameStart: true, sameEnd: true, collapsed: false, direction: 'forward'});
    await page.evaluate(() => (window as any).editorFixture.closed.toolbar.focus({preventScroll: true}));
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().focus)).toBe('generated');
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    expect(await page.evaluate(() => (window as any).editorFixture.closed.state())).toMatchObject({closed: true, focus: 'generated', open: true, visible: true, documentStopsAtClosedHost: true, controls: 1, owned: true});
    await page.evaluate(async () => {
      const f = (window as any).editorFixture, c = f.closed;
      c.generated = c.toolbar.shadowRoot.querySelector('en-toolbar');
      f.entries[0].editor.focus();
      const wrapper = f.scope.createElement('en-toolbar'); wrapper.label = 'Private authored actions';
      const native = f.scope.createElement('button'); native.type = 'button'; native.textContent = 'Private native action';
      const custom = f.scope.createElement('en-button'); custom.textContent = 'Private custom action';
      wrapper.append(native, custom); c.toolbar.append(wrapper);
      Object.assign(c, {wrapper, native, custom});
      await Promise.all([wrapper.updateComplete, custom.updateComplete]);
      c.toolbar.focus({preventScroll: true});
    });
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().focus)).toBe('native');
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    expect(await page.evaluate(() => (window as any).editorFixture.closed.state())).toMatchObject({focus: 'native', open: true, visible: true, documentStopsAtClosedHost: true});
    await page.evaluate(() => (window as any).editorFixture.closed.custom.focus({preventScroll: true}));
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().focus)).toBe('custom');
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    expect(await page.evaluate(() => (window as any).editorFixture.closed.state())).toMatchObject({focus: 'custom', open: true, visible: true, documentStopsAtClosedHost: true});
    expect(await page.evaluate(() => (window as any).editorFixture.closed.editorSnapshot())).toEqual(before.editor);
    await page.evaluate(() => {const c = (window as any).editorFixture.closed; c.toolbar.focus({preventScroll: true}); c.input.focus({preventScroll: true});});
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state())).toMatchObject({focus: 'private-input', open: false, documentStopsAtClosedHost: true});
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    expect(await page.evaluate(() => {const c = (window as any).editorFixture.closed; return {focus: c.state().focus, draft: c.input.value};})).toEqual({focus: 'private-input', draft: 'Private outside draft'});
    // A fresh connection must install its local observer without retaining the old one.
    await page.evaluate(async () => {const f = (window as any).editorFixture, c = f.closed; c.toolbar.remove(); c.root.prepend(c.toolbar); await c.toolbar.updateComplete; f.entries[0].editor.focus();});
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().open)).toBe(true);
    await page.evaluate(() => (window as any).editorFixture.closed.toolbar.focus({preventScroll: true}));
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().focus)).toBe('native');
    await page.evaluate(() => {const c = (window as any).editorFixture.closed; c.toolbar.focus({preventScroll: true}); document.querySelector<HTMLInputElement>('#essential')!.focus({preventScroll: true});});
    await expect(page.locator('#essential')).toBeFocused();
    await expect.poll(() => page.evaluate(() => (window as any).editorFixture.closed.state().open)).toBe(false);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await expect(page.locator('#essential')).toBeFocused();
    await expect(page.locator('#essential')).toHaveValue('Native fallback');
    expect(await page.evaluate(() => (window as any).editorFixture.closed.editorSnapshot())).toEqual(before.editor);
    await editor(page).evaluate((host: any) => host.focus());
    await expect(control(page)).toBeFocused();
    const restored = await page.evaluate(() => {const c = (window as any).editorFixture.closed; return {editor: c.editorSnapshot(), native: c.nativeSnapshot(), documentNative: c.documentSnapshot()};});
    await info.attach('closed-toolbar-native-selection', {body: JSON.stringify({before, restored}), contentType: 'application/json'});
    expect(restored.editor).toEqual(before.editor);
    expect(restored.native).toEqual(before.native);
    const retained = await page.evaluate(() => {const f = (window as any).editorFixture, c = f.closed; return {generated: c.generated === c.toolbar.shadowRoot.querySelector('en-toolbar'), wrapper: c.wrapper === c.toolbar.firstElementChild, native: c.native === c.wrapper.firstElementChild, custom: c.custom === c.wrapper.lastElementChild, actual: f.scope.mode, expected: f.state().requested === 'global' || !f.state().nativeCapability ? 'global' : 'scoped'};});
    expect(retained).toMatchObject({generated: true, wrapper: true, native: true, custom: true});
    expect(retained.actual).toBe(retained.expected);
    await info.attach('closed-toolbar-focus-ownership', {body: JSON.stringify({mode, initial, before, retained}), contentType: 'application/json'});
  });
}

// These regressions observe native composed ranges and direction independently
// of the public editor range, which intentionally has ordered coordinates.
async function settleDirection(page: Page) {
  // Exercise the backend's existing 20 ms native-focus restoration callback.
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())), 50)));
}
async function openDirection(page: Page, mode: string, backward: boolean, history = false) {
  await open(page, mode, 'nested');
  await page.evaluate(history => {
    const f = (window as any).editorFixture, entry = f.entries[0], host = entry.editor;
    entry.toolbar.remove();
    if (history) host.document = {type: 'en-rich-text', version: 1, doc: {type: 'doc', content: [
      {type: 'paragraph', content: [{type: 'text', text: 'Alpha beta gamma'}]},
      {type: 'paragraph', content: [{type: 'text', text: 'Second block'}]},
    ]}};
    const live = host.shadowRoot.querySelector('[contenteditable="true"]'), text = live.querySelector('p').firstChild;
    const next = f.scope.createElement('button'); next.id = 'after-direction-editor'; next.textContent = 'After editor'; entry.root.append(next);
    const d: any = {host, live, text, next, keys: [], navigationKeys: [], changes: 0, stateEvents: 0};
    host.addEventListener('en-change', () => d.changes++);
    host.addEventListener('en-editor-state', () => d.stateEvents++);
    d.seed = (backward: boolean) => host.ownerDocument.getSelection().setBaseAndExtent(d.text, backward ? 10 : 6, d.text, backward ? 6 : 10);
    d.inspect = () => {
      const {live, text} = d;
      const owner = host.ownerDocument, native = owner.getSelection();
      if (!native || typeof native.getComposedRanges !== 'function' || !('direction' in native)) throw new Error('Native composed selection and direction are required.');
      const ranges = native.getComposedRanges({shadowRoots: [host.shadowRoot]}).map((range: StaticRange) => {
        const copy = owner.createRange(); copy.setStart(range.startContainer, range.startOffset); copy.setEnd(range.endContainer, range.endOffset);
        return {startOffset: range.startOffset, endOffset: range.endOffset, sameStart: range.startContainer === text, sameEnd: range.endContainer === text, collapsed: range.collapsed, text: copy.toString()};
      });
      return {
        native: {text: native.toString(), direction: native.direction, ranges},
        oldDocumentSelection: d.readOldSelection?.() ?? null,
        semantics: {changes: d.changes, stateEvents: d.stateEvents, undoEnabled: host.getCommandState('undo').enabled},
        model: {range: host.captureRange(), selectionKey: host.selectionKey, value: host.value, revision: host.revision, hasSelection: host.hasSelection},
        focused: host.shadowRoot.activeElement === live, sameLive: host.shadowRoot.querySelector('[contenteditable="true"]') === live,
        sameText: live.querySelector('p').firstChild === text, content: live.textContent,
        keys: d.keys.map((event: KeyboardEvent) => ({key: event.key, shift: event.shiftKey, ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey, trusted: event.isTrusted, defaultPrevented: event.defaultPrevented})),
        navigationKeys: d.navigationKeys.map((event: KeyboardEvent) => ({key: event.key, shift: event.shiftKey, trusted: event.isTrusted})),
      };
    };
    live.addEventListener('keydown', (event: KeyboardEvent) => {if (!['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) d.keys.push(event);}, {capture: true});
    document.addEventListener('keydown', (event: KeyboardEvent) => {if (event.key === 'Tab') d.navigationKeys.push(event);}, {capture: true});
    (window as any).directionFixture = d; host.focus();
  }, history);
  await page.evaluate(backward => (window as any).directionFixture.seed(backward), backward);
  await expect(control(page)).toBeFocused();
  await settleDirection(page);
  await expect.poll(() => editor(page).evaluate((host: any) => host.captureRange()?.expectedText)).toBe('beta');
  const actual = await page.evaluate(() => (window as any).editorFixture.state());
  expect(actual.actual).toBe(mode === 'global' || !actual.nativeCapability ? 'global' : 'scoped');
  return directionSnapshot(page);
}
async function directionSnapshot(page: Page) {return page.evaluate(() => (window as any).directionFixture.inspect());}
function expectedDirection(backward: boolean, start = 6, end = 10, text = 'beta') {
  return {text, direction: backward ? 'backward' : 'forward', ranges: [{startOffset: start, endOffset: end, sameStart: true, sameEnd: true, collapsed: false, text}]};
}
function expectDirectionState(state: any, backward: boolean, start = 6, end = 10, text = 'beta') {
  expect(state.native).toEqual(expectedDirection(backward, start, end, text));
  expect(state).toMatchObject({focused: true, sameLive: true, sameText: true});
  expect(state.model.range).toMatchObject({coordinate: 'structured', from: start + 1, to: end + 1, expectedText: text});
}
function expectNativeCaret(state: any) {
  // An interior caret avoids the backend's document-start focus-reset heuristic.
  // A collapsed native selection has no required forward/backward direction.
  expect(state.native.text).toBe('');
  expect(state.native.ranges).toEqual([{startOffset: 3, endOffset: 3, sameStart: true, sameEnd: true, collapsed: true, text: ''}]);
  expect(state).toMatchObject({focused: true, sameLive: true, sameText: true, model: {
    hasSelection: false, range: {coordinate: 'structured', from: 4, to: 4, expectedText: ''},
  }});
}
function expectSelectionOnly(state: any, seed: any) {
  expect(state.model.value).toBe(seed.model.value); expect(state.model.revision).toBe(seed.model.revision);
  expect(state.semantics).toMatchObject({changes: 0, undoEnabled: false});
}
async function extendDirection(page: Page, backward: boolean) {
  await expect(control(page)).toBeFocused();
  await page.keyboard.press('Shift+ArrowLeft');
  await settleDirection(page);
  const state = await directionSnapshot(page);
  expectDirectionState(state, backward, backward ? 5 : 6, backward ? 10 : 9, backward ? ' beta' : 'bet');
  expect(state.keys.filter((key: any) => key.key === 'ArrowLeft').at(-1)).toMatchObject({key: 'ArrowLeft', shift: true, ctrl: false, meta: false, alt: false, trusted: true});
  return state;
}

for (const mode of ['auto', 'global']) for (const backward of [false, true]) {
  test(`${mode}: ${backward ? 'backward' : 'forward'} native direction survives public focus and same-range bookmark restoration`, async ({page}, info) => {
    const baselineSeed = await openDirection(page, mode, backward);
    expectDirectionState(baselineSeed, backward);
    const baselineKey = await extendDirection(page, backward);

    const focusSeed = await openDirection(page, mode, backward);
    expectDirectionState(focusSeed, backward);
    await page.locator('#essential').focus();
    const immediate = await editor(page).evaluate((host: any) => {host.focus(); return (window as any).directionFixture.inspect();});
    expectDirectionState(immediate, backward);
    await settleDirection(page);
    const restored = await directionSnapshot(page);
    expect(restored.native).toEqual(focusSeed.native); expect(restored.model).toEqual(focusSeed.model);
    await editor(page).evaluate((host: any) => host.focus());
    await settleDirection(page);
    expect((await directionSnapshot(page)).native).toEqual(focusSeed.native);
    const focusKey = await extendDirection(page, backward);
    expect(focusKey.native).toEqual(baselineKey.native); expect(focusKey.model).toEqual(baselineKey.model);

    const reverseSeed = await openDirection(page, mode, !backward);
    expectDirectionState(reverseSeed, !backward);
    await page.evaluate(backward => (window as any).directionFixture.seed(backward), backward);
    await settleDirection(page);
    const reversed = await directionSnapshot(page);
    expectDirectionState(reversed, backward);
    await settleDirection(page);
    const reversedStable = await directionSnapshot(page);
    expect(reversedStable.semantics.stateEvents).toBe(reversed.semantics.stateEvents);
    expect(reversedStable.native).toEqual(reversed.native); expect(reversedStable.model).toEqual(reversed.model);
    expect(reversed.model.selectionKey).toBe(reverseSeed.model.selectionKey);
    await page.evaluate(() => {
      const d = (window as any).directionFixture;
      d.bookmark = d.host.captureBookmark();
      d.host.ownerDocument.getSelection().setBaseAndExtent(d.text, 3, d.text, 3);
    });
    await expect(editor(page)).toHaveJSProperty('hasSelection', false);
    const bookmarkCaret = await directionSnapshot(page); expectNativeCaret(bookmarkCaret);
    await page.locator('#essential').focus();
    const bookmarkRestore = await editor(page).evaluate((host: any) => {
      const d = (window as any).directionFixture; const accepted = host.restoreBookmark(d.bookmark);
      return {accepted, state: d.inspect()};
    });
    expect(bookmarkRestore.accepted).toBe(true); expectDirectionState(bookmarkRestore.state, backward);
    await settleDirection(page);
    expect((await directionSnapshot(page)).native).toEqual(reversed.native);
    const bookmarkKey = await extendDirection(page, backward);
    expect(bookmarkKey.native).toEqual(baselineKey.native); expect(bookmarkKey.model).toEqual(baselineKey.model);
    for (const state of [baselineSeed, baselineKey]) expectSelectionOnly(state, baselineSeed);
    for (const state of [focusSeed, immediate, restored, focusKey]) expectSelectionOnly(state, focusSeed);
    for (const state of [reverseSeed, reversed, reversedStable, bookmarkCaret, bookmarkRestore.state, bookmarkKey]) expectSelectionOnly(state, reverseSeed);
    await info.attach('native-direction-focus-and-bookmark', {body: JSON.stringify({mode, backward, baselineSeed, baselineKey, focusSeed, immediate, restored, focusKey, reverseSeed, reversed, reversedStable, bookmarkCaret, bookmarkRestore, bookmarkKey}), contentType: 'application/json'});
  });
}

for (const mode of ['auto', 'global']) {
  test(`${mode}: queued native direction work yields to newer bookmarks, author writes and reconnects`, async ({page}, info) => {
    const authorityDiagnostics: any = {};
    try {
      const seed = await openDirection(page, mode, false);
      expectDirectionState(seed, false);
      await page.evaluate(() => {const d = (window as any).directionFixture; d.forwardBookmark = d.host.captureBookmark();});
      // The native selectionchange task is still queued when explicit public
      // bookmark restoration writes the authoritative opposite direction.
      const bookmark = await page.evaluate(() => {
        const d = (window as any).directionFixture; d.seed(true);
        const accepted = d.host.restoreBookmark(d.forwardBookmark);
        return {accepted, immediate: d.inspect()};
      });
      expect(bookmark.accepted).toBe(true); expectDirectionState(bookmark.immediate, false);
      await settleDirection(page);
      const afterBookmark = await directionSnapshot(page);
      expect(afterBookmark.native).toEqual(seed.native); expect(afterBookmark.model).toEqual(seed.model);

      const changedRanges: any[] = []; authorityDiagnostics.changedRanges = changedRanges;
      for (const [backward, start, end, selected, keyStart, keyEnd, keyText] of [
        [false, 1, 5, 'lpha', 1, 4, 'lph'], [true, 7, 10, 'eta', 6, 10, 'beta'],
      ] as const) {
        await page.evaluate(({backward, start, end}) => {
          const d = (window as any).directionFixture;
          d.host.ownerDocument.getSelection().setBaseAndExtent(d.text, backward ? end : start, d.text, backward ? start : end);
        }, {backward, start, end});
        await settleDirection(page);
        const changed = await directionSnapshot(page), observed: any = {changed}; changedRanges.push(observed);
        expectDirectionState(changed, backward, start, end, selected); expectSelectionOnly(changed, seed);
        await expect(control(page)).toBeFocused(); await page.keyboard.press('Shift+ArrowLeft'); await settleDirection(page);
        const key = await directionSnapshot(page); observed.key = key;
        expectDirectionState(key, backward, keyStart, keyEnd, keyText); expectSelectionOnly(key, seed);
        expect(key.keys.at(-1)).toMatchObject({key: 'ArrowLeft', shift: true, ctrl: false, meta: false, alt: false, trusted: true});
      }

      // A synthetic notification controls queue ordering only. Selection itself
      // is native, and no private editor or backend state is read or patched.
      const afterAuthor = await page.evaluate(async () => {
        const d = (window as any).directionFixture;
        queueMicrotask(() => {d.host.value = 'Authoritative replacement'; d.authorSnapshot = d.inspect();});
        d.seed(true); document.dispatchEvent(new Event('selectionchange'));
        await Promise.resolve(); return d.authorSnapshot;
      });
      await settleDirection(page);
      const authorSettled = await directionSnapshot(page);
      expect(authorSettled.model).toEqual(afterAuthor.model);
      expect(authorSettled.model).toMatchObject({value: 'Authoritative replacement', revision: seed.model.revision + 1, hasSelection: false, range: {from: 1, to: 1, expectedText: ''}});
      expect(authorSettled).toMatchObject({focused: true, sameLive: true, content: 'Authoritative replacement'});
      expect(authorSettled.native.text).toBe(''); expect(authorSettled.native.ranges).toHaveLength(1); expect(authorSettled.native.ranges[0].collapsed).toBe(true);

      await openDirection(page, mode, false);
      const detached = await page.evaluate(() => {
        const d = (window as any).directionFixture, parent = d.host.parentNode, next = d.host.nextSibling;
        d.seed(true); document.dispatchEvent(new Event('selectionchange'));
        d.host.remove(); d.host.value = 'Reconnected author'; parent.insertBefore(d.host, next);
        document.querySelector<HTMLInputElement>('#essential')!.focus();
        return {value: d.host.value, revision: d.host.revision};
      });
      await expect(control(page)).toHaveAttribute('contenteditable', 'true');
      await expect.poll(() => page.evaluate(() => {
        const d = (window as any).directionFixture, live = d.host.shadowRoot.querySelector('[contenteditable="true"]');
        return Boolean(live && live !== d.live);
      })).toBe(true);
      await settleDirection(page);
      await expect(page.locator('#essential')).toBeFocused();
      expect(await editor(page).evaluate((host: any) => ({value: host.value, revision: host.revision, selected: host.hasSelection}))).toEqual({...detached, selected: false});
      await info.attach('native-direction-authority-races', {body: JSON.stringify({mode, seed, bookmark, afterBookmark, changedRanges, afterAuthor, authorSettled, detached}), contentType: 'application/json'});
    } finally {
      // Failure evidence reads current public/native state only, with no focus,
      // selection write, retry or wait that could repair or replace the failure.
      let finalObservation: any;
      try {
        finalObservation = await page.evaluate(() => {
          const d = (window as any).directionFixture, errors: {observation: string; error: string}[] = [];
          if (!d) return {available: false, errors};
          const read = (observation: string, getter: () => any) => {
            try {return getter();} catch (error) {errors.push({observation, error: String(error)}); return null;}
          };
          const currentNative = read('current-native', () => {
            const owner = d.host.ownerDocument, native = owner.getSelection();
            return {text: native.toString(), direction: native.direction,
              ranges: native.getComposedRanges({shadowRoots: [d.host.shadowRoot]}).map((range: StaticRange) => ({
                startOffset: range.startOffset, endOffset: range.endOffset, sameStart: range.startContainer === d.text,
                sameEnd: range.endContainer === d.text, collapsed: range.collapsed,
              }))};
          });
          const publicModel = read('public-model', () => ({range: d.host.captureRange(), selectionKey: d.host.selectionKey,
            value: d.host.value, revision: d.host.revision, hasSelection: d.host.hasSelection}));
          const oldDocumentSelection = read('old-document-native', () => d.readOldSelection?.() ?? null);
          const capability = read('root-capability', () => {
            const root = d.host.shadowRoot, supported = typeof root.getSelection === 'function', native = supported ? root.getSelection() : null;
            return {supported, nativePresent: Boolean(native), rangeCount: native?.rangeCount ?? null,
              hasAnchor: Boolean(native?.anchorNode), hasFocus: Boolean(native?.focusNode),
              unreadable: supported && Boolean(native) && (native.rangeCount === 0 || !native.anchorNode || !native.focusNode)};
          });
          const ownership = read('ownership', () => ({connected: d.host.isConnected, ownerHasFocus: d.host.ownerDocument.hasFocus(),
            localFocus: d.host.shadowRoot.activeElement === d.live, sameText: d.live.querySelector('p')?.firstChild === d.text,
            currentOwner: d.live.ownerDocument === d.host.ownerDocument, changedOwner: Boolean(d.oldOwner && d.oldOwner !== d.host.ownerDocument)}));
          const journalLength = d.oldSelectionEvents?.length ?? 0;
          return {available: true, currentNative, publicModel, oldDocumentSelection, capability, ownership,
            oldSelectionEvents: d.oldSelectionEvents?.slice(0, 128) ?? [], journalLength, journalTruncated: journalLength > 128, errors};
        });
      } catch (error) {finalObservation = {observationError: String(error)};}
      try {
        await info.attach('native-direction-authority-final-observation', {body: JSON.stringify({mode, ...authorityDiagnostics, finalObservation}), contentType: 'application/json'});
      } catch (error) {info.annotations.push({type: 'authority-observation-attachment-error', description: String(error)});}
    }
  });

  test(`${mode}: trusted native focus and keyboard history preserve selection direction`, async ({page}, info) => {
    const navigation: any[] = [];
    for (const backward of [false, true]) {
      const seed = await openDirection(page, mode, backward);
      expectDirectionState(seed, backward);
      await page.locator('#essential').focus(); await page.keyboard.press('Tab');
      await expect(control(page)).toBeFocused(); await settleDirection(page);
      const tab = await directionSnapshot(page); expectDirectionState(tab, backward);
      await page.locator('#after-direction-editor').focus(); await page.keyboard.press('Shift+Tab');
      await expect(control(page)).toBeFocused(); await settleDirection(page);
      const shiftTab = await directionSnapshot(page); expectDirectionState(shiftTab, backward);
      expect(shiftTab.navigationKeys).toEqual([{key: 'Tab', shift: false, trusted: true}, {key: 'Tab', shift: true, trusted: true}]);
      const key = await extendDirection(page, backward);
      navigation.push({backward, seed, tab, shiftTab, key});
    }

    const historySeed = await openDirection(page, mode, true, true);
    expectDirectionState(historySeed, true);
    const replaced = await editor(page).evaluate((host: any) => host.replaceRanges([{range: {coordinate: 'text', from: 17, to: 23, expectedText: 'Second', revision: host.revision}, runs: [{kind: 'text', text: 'Changed'}]}]));
    expect(replaced).toBe(true);
    await settleDirection(page);
    const afterEdit = await directionSnapshot(page); expectDirectionState(afterEdit, true);
    expect(afterEdit.model.value).toBe('Alpha beta gamma\nChanged block');
    await page.evaluate(() => (window as any).directionFixture.seed(false));
    await settleDirection(page);
    expectDirectionState(await directionSnapshot(page), false);
    // Keyboard history invokes the backend directly; no host.focus(), public
    // undo()/redo(), or locator refocus can repair this regression for the test.
    await page.keyboard.press('ControlOrMeta+z'); await settleDirection(page);
    const undo = await directionSnapshot(page); expectDirectionState(undo, true);
    expect(undo.model.value).toBe('Alpha beta gamma\nSecond block');
    const undoKey = await extendDirection(page, true);
    await page.keyboard.press('ControlOrMeta+Shift+z'); await settleDirection(page);
    const redo = await directionSnapshot(page); expectDirectionState(redo, false);
    expect(redo.model.value).toBe('Alpha beta gamma\nChanged block');
    const redoKey = await extendDirection(page, false);
    const historyKeys = redoKey.keys.filter((key: any) => key.key.toLowerCase() === 'z');
    expect(historyKeys).toHaveLength(2);
    expect(historyKeys.every((key: any) => key.trusted && (key.ctrl !== key.meta) && !key.alt)).toBe(true);
    expect(historyKeys.map((key: any) => key.shift)).toEqual([false, true]);
    await info.attach('native-direction-navigation-and-history', {body: JSON.stringify({mode, navigation, historySeed, afterEdit, undo, undoKey, redo, redoKey}), contentType: 'application/json'});
  });
}


// Same-document NodeSelection/AllSelection coverage. The rejected adopted-backend
// phases remain in the hash-bound preimage and disposition map outside collection.
for (const mode of ['auto', 'global']) {
  test(`${mode}: token and select-all bookmarks preserve same-document native selection and clipboard`, async ({page}, info) => {
    const evidence: any = {mode};
    try {
      await open(page, mode, 'nested');
      await page.evaluate(() => {
        const f = (window as any).editorFixture, host = f.entries[0].editor;
        f.entries[0].toolbar.remove();
        host.registerToken('selection-fixture', (run: any) => host.ownerDocument.createTextNode(run.text), {part: 'selection-fixture-token'});
        host.document = {type: 'en-rich-text', version: 1, doc: {type: 'doc', content: [
          {type: 'paragraph', content: [{type: 'text', text: 'Alpha beta gamma'}]},
          {type: 'paragraph', content: [{type: 'token', attrs: {run: {kind: 'token', id: 'selection-token', type: 'selection-fixture', text: '@R', label: 'Reference R', data: null}}}]},
        ]}};
        const live = host.shadowRoot.querySelector('[contenteditable="true"]');
        const d: any = {host, owner: document, root: host.shadowRoot, live, firstText: live.querySelector('p').firstChild,
          token: live.querySelector('[part~=selection-fixture-token]'), changes: 0, keys: [], clicks: [], wordClicks: []};
        (window as any).atomicSelectionFixture = d;
        d.tokenParagraph = d.token.parentNode;
        const endpoint = (node: Node) => node === d.firstText ? 'first-text' : node === d.tokenParagraph ? 'token-paragraph' : node === d.live ? 'live' : 'other';
        d.readNative = () => {
          const native = d.owner.getSelection();
          return {text: native.toString(), direction: native.direction, ranges: native.getComposedRanges({shadowRoots: [d.root]}).map((range: StaticRange) => {
            const copy = d.owner.createRange(); copy.setStart(range.startContainer, range.startOffset); copy.setEnd(range.endContainer, range.endOffset);
            return {start: endpoint(range.startContainer), startOffset: range.startOffset, end: endpoint(range.endContainer), endOffset: range.endOffset,
              collapsed: range.collapsed, text: copy.toString()};
          })};
        };
        d.inspect = () => ({native: d.readNative(), rawReaders: f.selectionReaderEvidence(), range: host.captureRange(), value: host.value, revision: host.revision,
          hasSelection: host.hasSelection, changes: d.changes, undoEnabled: host.getCommandState('undo').enabled,
          focused: d.root.activeElement === live, ownerHasFocus: d.owner.hasFocus(), sameOwner: host.ownerDocument === d.owner,
          sameRoot: host.shadowRoot === d.root, sameLive: d.root.querySelector('[contenteditable="true"]') === live,
          sameText: live.querySelector('p').firstChild === d.firstText, sameToken: live.querySelector('[part~=selection-fixture-token]') === d.token,
          keys: [...d.keys], clicks: [...d.clicks]});
        host.addEventListener('en-change', () => d.changes++);
        live.addEventListener('keydown', (event: KeyboardEvent) => {if (!['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) d.keys.push({key: event.key, trusted: event.isTrusted, shift: event.shiftKey, ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey});}, {capture: true});
        d.token.addEventListener('click', (event: MouseEvent) => d.clicks.push({trusted: event.isTrusted, button: event.button}));
        live.addEventListener('dblclick', (event: MouseEvent) => d.wordClicks.push({trusted: event.isTrusted, button: event.button}));
      });
      const host = editor(page), live = control(page);
      const inspect = () => page.evaluate(() => (window as any).atomicSelectionFixture.inspect());
      const wordGesture = async (target: ReturnType<typeof control>, observed: any) => {
        const point = await target.locator('p').first().evaluate(paragraph => {
          const range = paragraph.ownerDocument.createRange(), text = paragraph.firstChild!;
          range.setStart(text, 6); range.setEnd(text, 10);
          const word = range.getBoundingClientRect(), box = paragraph.getBoundingClientRect();
          return {x: (word.left + word.right) / 2 - box.left, y: (word.top + word.bottom) / 2 - box.top};
        });
        const counts = await page.evaluate(() => {const d = (window as any).atomicSelectionFixture; d.wordText = d.host.shadowRoot.querySelector('[contenteditable="true"] p').firstChild; return {keys: d.keys.length, doubleClicks: d.wordClicks.length};});
        const read = () => page.evaluate(() => {
          const d = (window as any).atomicSelectionFixture, owner = d.host.ownerDocument, native = owner.getSelection();
          return {native: {text: native.toString(), direction: native.direction, ranges: native.getComposedRanges({shadowRoots: [d.host.shadowRoot]}).map((range: StaticRange) => ({
            sameStart: range.startContainer === d.wordText, sameEnd: range.endContainer === d.wordText,
            startOffset: range.startOffset, endOffset: range.endOffset, collapsed: range.collapsed,
          }))}, rawReaders: (window as any).editorFixture.selectionReaderEvidence(), range: d.host.captureRange(), key: d.keys.at(-1), doubleClick: d.wordClicks.at(-1), keyCount: d.keys.length, doubleClickCount: d.wordClicks.length};
        });
        await target.locator('p').first().dblclick({position: point}); await settleDirection(page);
        const before = await read(); observed.before = before;
        expect(before.doubleClick).toEqual({trusted: true, button: 0});
        expect(before.doubleClickCount).toBe(counts.doubleClicks + 1); expect(before.keyCount).toBe(counts.keys);
        expect(before.native.text).toBe('beta');
        expect(before.native.ranges).toEqual([{sameStart: true, sameEnd: true, startOffset: 6, endOffset: 10, collapsed: false}]);
        expect(before.range).toMatchObject({coordinate: 'structured', from: 7, to: 11, expectedText: 'beta'});
        await expect(target).toBeFocused(); await page.keyboard.press('Shift+ArrowLeft'); await settleDirection(page);
        const after = await read(); observed.after = after;
        expect(after.key).toMatchObject({key: 'ArrowLeft', shift: true, trusted: true, ctrl: false, meta: false, alt: false});
        expect(after.keyCount).toBe(counts.keys + 1); expect(after.doubleClickCount).toBe(counts.doubleClicks + 1);
        expect(after.native.ranges).toHaveLength(1);
        const range = after.native.ranges[0];
        expect(range).toMatchObject({sameStart: true, sameEnd: true, collapsed: false});
        expect([[6, 9], [5, 10]]).toContainEqual([range.startOffset, range.endOffset]);
        const selected = 'Alpha beta gamma'.slice(range.startOffset, range.endOffset);
        expect(after.native.text).toBe(selected);
        expect(after.range).toMatchObject({coordinate: 'structured', from: range.startOffset + 1, to: range.endOffset + 1, expectedText: selected});
        return observed;
      };
      // Separate continuous multi-click sequences spatially before entering the
      // authoritative Node/All state. The following word gesture stays untouched.
      const isolatedCaret = async (target: ReturnType<typeof control>, hostTarget: ReturnType<typeof editor>, observed: any) => {
        const geometry = await target.locator('p').first().evaluate(paragraph => {
          const owner = paragraph.ownerDocument, text = paragraph.firstChild!, box = paragraph.getBoundingClientRect();
          const at = (offset: number) => {const range = owner.createRange(); range.setStart(text, offset); range.collapse(true); return range.getBoundingClientRect().left;};
          const line = owner.createRange(); line.setStart(text, 2); line.setEnd(text, 4);
          const vertical = line.getBoundingClientRect();
          const word = owner.createRange(); word.setStart(text, 6); word.setEnd(text, 10); const beta = word.getBoundingClientRect();
          const style = owner.defaultView!.getComputedStyle(paragraph), borderLeft = parseFloat(style.borderLeftWidth), borderTop = parseFloat(style.borderTopWidth);
          return {point: {x: at(3) - box.left - borderLeft, y: (vertical.top + vertical.bottom) / 2 - box.top - borderTop},
            caretX: at(3), leftX: at(2), rightX: at(4), beta: {x: (beta.left + beta.right) / 2, y: (beta.top + beta.bottom) / 2}, lineHeight: vertical.height};
        });
        observed.geometry = geometry;
        expect(Number.isFinite(geometry.point.x) && Number.isFinite(geometry.point.y)).toBe(true);
        expect(geometry.lineHeight).toBeGreaterThan(0);
        expect(geometry.caretX - geometry.leftX).toBeGreaterThan(2); expect(geometry.rightX - geometry.caretX).toBeGreaterThan(2);
        await page.evaluate(() => {
          const d = (window as any).atomicSelectionFixture;
          d.caretLive = d.host.shadowRoot.querySelector('[contenteditable="true"]'); d.caretText = d.caretLive.querySelector('p').firstChild;
          d.caretPointer = null;
          d.caretLive.addEventListener('mousedown', (event: MouseEvent) => {d.caretPointer = {trusted: event.isTrusted, button: event.button,
            clientX: event.clientX, clientY: event.clientY, ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey, shift: event.shiftKey};}, {once: true, capture: true});
        });
        await target.locator('p').first().click({position: geometry.point});
        const read = () => page.evaluate(() => {
          const d = (window as any).atomicSelectionFixture, native = d.host.ownerDocument.getSelection();
          return {pointer: d.caretPointer, focused: d.host.shadowRoot.activeElement === d.caretLive, ownerHasFocus: d.host.ownerDocument.hasFocus(),
            native: {text: native.toString(), direction: native.direction, ranges: native.getComposedRanges({shadowRoots: [d.host.shadowRoot]}).map((range: StaticRange) => ({
              sameStart: range.startContainer === d.caretText, sameEnd: range.endContainer === d.caretText, startOffset: range.startOffset, endOffset: range.endOffset, collapsed: range.collapsed}))},
            range: d.host.captureRange(), hasSelection: d.host.hasSelection};
        });
        observed.firstRead = await read();
        // Native selectionchange synchronizes the public model asynchronously.
        // This semantic readiness assertion does not isolate clicks by time.
        await expect(hostTarget).toHaveJSProperty('hasSelection', false);
        const state = await read(); observed.state = state;
        expect(state.pointer).toMatchObject({trusted: true, button: 0, ctrl: false, meta: false, alt: false, shift: false});
        expect((state.pointer.clientX - geometry.beta.x) ** 2 + (state.pointer.clientY - geometry.beta.y) ** 2).toBeGreaterThanOrEqual(100);
        expect(state).toMatchObject({focused: true, ownerHasFocus: true, hasSelection: false});
        expect(state.native.text).toBe('');
        expect(state.native.ranges).toEqual([{sameStart: true, sameEnd: true, startOffset: 3, endOffset: 3, collapsed: true}]);
        expect(state.range).toMatchObject({coordinate: 'structured', from: 4, to: 4, expectedText: ''});
      };
      const copySelection = async (observed: any, all: boolean) => {
        // A native DataTransfer exercises the public copy event serialization.
        // This synthetic event makes no claim about OS clipboard permissions.
        const copied = await page.evaluate(() => {
          const d = (window as any).atomicSelectionFixture, data = new DataTransfer();
          const event = new ClipboardEvent('copy', {bubbles: true, composed: true, cancelable: true, clipboardData: data});
          const before = d.inspect(); d.live.dispatchEvent(event);
          // The copy handler writes the event's store. Constructor-input identity
          // is browser evidence, not an assumption about where those writes land.
          const actual = event.clipboardData;
          return {trusted: event.isTrusted, prevented: event.defaultPrevented, eventDataPresent: actual !== null, eventDataIsSupplied: actual === data,
            supplied: {plain: data.getData('text/plain'), structuredJSON: data.getData('application/x-en-editor+json'), types: [...data.types]},
            plain: actual?.getData('text/plain') ?? null, structuredJSON: actual?.getData('application/x-en-editor+json') ?? null,
            types: actual ? [...actual.types] : [], before, after: d.inspect()};
        });
        // Preserve both raw stores before any payload assertion or JSON parsing.
        observed.copy = copied;
        expect(copied.eventDataPresent).toBe(true);
        expect(copied.types).toContain('text/plain'); expect(copied.types).toContain('application/x-en-editor+json');
        expect(copied.structuredJSON).not.toBe(''); expect(copied.structuredJSON).not.toBeNull();
        const structured = JSON.parse(copied.structuredJSON!); observed.copy.structured = structured;
        const token = {kind: 'token', id: 'selection-token', type: 'selection-fixture', text: '@R', label: 'Reference R', data: null};
        expect(copied).toMatchObject({trusted: false, prevented: true, plain: all ? 'Alpha beta gamma\n@R' : '@R'});
        expect(structured).toMatchObject({type: 'en-editor-clipboard', version: 1});
        expect(structured.runs).toEqual(all ? [{kind: 'text', text: 'Alpha beta gamma'}, {kind: 'text', text: '\n'}, token] : [token]);
        expect(copied.after).toEqual(copied.before);
      };
      await wordGesture(live, evidence.baselineWordGesture = {});
      await host.locator('[part~=selection-fixture-token]').click(); await settleDirection(page);
      const baselineNode = await inspect(); evidence.baselineNode = baselineNode;
      expect(baselineNode).toMatchObject({focused: true, sameText: true, sameToken: true, hasSelection: true, undoEnabled: false, value: 'Alpha beta gamma\n@R'});
      expect(baselineNode.clicks).toEqual([{trusted: true, button: 0}]);
      expect(baselineNode.range).toMatchObject({coordinate: 'structured', from: 19, to: 20, expectedText: '@R'});
      expect(baselineNode.native.ranges).toEqual([{start: 'token-paragraph', startOffset: 0, end: 'token-paragraph', endOffset: 1, collapsed: false, text: '@R'}]);
      await copySelection(evidence.baselineNode, false);
      await isolatedCaret(live, host, evidence.beforeBaselineSelectAll = {});
      await page.keyboard.press('ControlOrMeta+a'); await settleDirection(page);
      const baselineAll = await inspect(); evidence.baselineAll = baselineAll;
      expect(baselineAll).toMatchObject({focused: true, sameText: true, sameToken: true, hasSelection: true, undoEnabled: false, revision: baselineNode.revision, value: baselineNode.value});
      expect(baselineAll.range).toMatchObject({coordinate: 'structured', from: 0, to: 21, expectedText: 'Alpha beta gamma\n@R'});
      expect(baselineAll.native.ranges).toEqual([{start: 'live', startOffset: 0, end: 'live', endOffset: 2, collapsed: false, text: 'Alpha beta gamma@R'}]);
      expect(baselineAll.keys.at(-1)).toMatchObject({key: 'a', trusted: true, shift: false, alt: false});
      expect(baselineAll.keys.at(-1).ctrl !== baselineAll.keys.at(-1).meta).toBe(true);
      await copySelection(evidence.baselineAll, true);
      await wordGesture(live, evidence.baselineAllToText = {});
      for (const phase of ['before', 'after'] as const) {
        expect(evidence.baselineAllToText[phase].native).toEqual(evidence.baselineWordGesture[phase].native);
        expect(evidence.baselineAllToText[phase].range).toEqual(evidence.baselineWordGesture[phase].range);
      }
      const stable = (state: any) => expect(state).toMatchObject({value: 'Alpha beta gamma\n@R', revision: baselineNode.revision,
        changes: 0, undoEnabled: false, focused: true, ownerHasFocus: true, sameOwner: true, sameRoot: true, sameLive: true, sameText: true, sameToken: true});
      const expectNode = (state: any) => {
        stable(state); expect(state.hasSelection).toBe(true);
        expect(state.range).toMatchObject({coordinate: 'structured', from: 19, to: 20, expectedText: '@R'});
        expect(state.native).toEqual(baselineNode.native);
      };
      const expectAll = (state: any) => {
        stable(state); expect(state.hasSelection).toBe(true);
        expect(state.range).toMatchObject({coordinate: 'structured', from: 0, to: 21, expectedText: 'Alpha beta gamma\n@R'});
        expect(state.native).toEqual(baselineAll.native);
      };
      const selectPlainText = async (observed: any) => {
        await wordGesture(live, observed);
        for (const phase of ['before', 'after'] as const) {
          expect(observed[phase].native).toEqual(evidence.baselineWordGesture[phase].native);
          expect(observed[phase].range).toEqual(evidence.baselineWordGesture[phase].range);
        }
        const state = await inspect(); observed.state = state; stable(state);
      };
      await host.locator('[part~=selection-fixture-token]').click(); await settleDirection(page);
      const node = await inspect(); evidence.node = node; expectNode(node);
      expect(node.clicks).toEqual([{trusted: true, button: 0}, {trusted: true, button: 0}]);
      await page.evaluate(() => {const d = (window as any).atomicSelectionFixture; d.nodeBookmark = d.host.captureBookmark();});
      await selectPlainText(evidence.nodeToText = {});
      await isolatedCaret(live, host, evidence.beforeNodeRestore = {});
      await page.locator('#essential').focus();
      expect(await page.evaluate(() => {const d = (window as any).atomicSelectionFixture; return d.host.restoreBookmark(d.nodeBookmark);})).toBe(true);
      await expect(live).toBeFocused(); await settleDirection(page);
      const nodeRestored = await inspect(); evidence.nodeRestored = nodeRestored; expectNode(nodeRestored);
      await copySelection(evidence.nodeRestored, false);
      await selectPlainText(evidence.restoredNodeWordGesture = {});
      await isolatedCaret(live, host, evidence.beforeSelectAll = {});
      await page.keyboard.press('ControlOrMeta+a'); await settleDirection(page);
      const all = await inspect(); evidence.all = all; expectAll(all);
      expect(all.keys.at(-1)).toMatchObject({key: 'a', trusted: true, shift: false, alt: false});
      expect(all.keys.at(-1).ctrl !== all.keys.at(-1).meta).toBe(true);
      await page.evaluate(() => {const d = (window as any).atomicSelectionFixture; d.allBookmark = d.host.captureBookmark();});
      await selectPlainText(evidence.allToText = {});
      await isolatedCaret(live, host, evidence.beforeAllRestore = {});
      await page.locator('#essential').focus();
      expect(await page.evaluate(() => {const d = (window as any).atomicSelectionFixture; return d.host.restoreBookmark(d.allBookmark);})).toBe(true);
      await expect(live).toBeFocused(); await settleDirection(page);
      const allRestored = await inspect(); evidence.allRestored = allRestored; expectAll(allRestored);
      await copySelection(evidence.allRestored, true);
      await selectPlainText(evidence.restoredAllToText = {});
    } finally {
      try {
        evidence.final = await page.evaluate(() => {
          const d = (window as any).atomicSelectionFixture, errors: string[] = [];
          let state = null, rawReaders = null;
          try {state = d?.inspect?.() ?? null;} catch (error) {errors.push(String(error));}
          try {rawReaders = (window as any).editorFixture?.selectionReaderEvidence?.() ?? null;} catch (error) {errors.push(String(error));}
          return {state, rawReaders, errors};
        });
      } catch (error) {evidence.final = {observationError: String(error)};}
      try {await info.attach('same-document-node-all-selection-and-clipboard', {body: JSON.stringify(evidence), contentType: 'application/json'});}
      catch (error) {info.annotations.push({type: 'node-all-evidence-error', description: String(error)});}
    }
  });
}

// Append to editor.spec.ts using its existing public fixture helpers.
// Dispose the source backend in its original document before constructing the destination editor.
for (const mode of ['auto', 'global']) {
  test(`${mode}: a fresh destination-document editor receives a document without source history, bookmarks, or pending toolbar intent`, async ({page}, info) => {
    const evidence: Record<string, any> = {mode};
    let failed = false;
    try {
      await open(page, mode, 'nested');
      await editor(page).evaluate((host: any) => {
        host.focus();
        const text = host.shadowRoot.querySelector('[contenteditable="true"] p').firstChild;
        if (text?.nodeType !== 3 || text.textContent !== 'Alpha beta gamma') throw new Error('Expected the source fixture Text.');
        host.ownerDocument.getSelection().setBaseAndExtent(text, 6, text, 10);
      });
      await expect.poll(() => editor(page).evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 7, to: 11, expectedText: 'beta'});
      expect(await editor(page).evaluate((host: any) => host.execute('bold'))).toBe(true);
      await expect(editor(page).locator('strong')).toHaveText('beta');
      await select(page);
      await expect.poll(() => editor(page).evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 1, to: 7, expectedText: 'Alpha '});
      await expect(base(page)).toBeVisible();
      await toolbar(page).getByRole('button', {name: 'Link', exact: true}).click();
      const pendingField = toolbar(page).getByRole('textbox', {name: 'Link URL'});
      await expect(pendingField).toBeFocused(); await pendingField.fill('https://example.com/source-stale');
      evidence.source = await page.evaluate(() => {
        const f = (window as any).editorFixture, source = f.entries[0].editor;
        const model = (host: any) => ({document: host.document, value: host.value, revision: host.revision,
          range: host.captureRange(), selectionKey: host.selectionKey, hasSelection: host.hasSelection,
          undoEnabled: host.getCommandState('undo').enabled, redoEnabled: host.getCommandState('redo').enabled, composing: host.composing});
        const d: any = {source, sourceRoot: source.shadowRoot, sourceLive: source.shadowRoot.querySelector('[contenteditable="true"]'), sourceOwner: source.ownerDocument,
          toolbar: f.entries[0].toolbar, snapshot: source.document, bookmark: source.captureBookmark(), model, keys: []};
        // Serialize the public document before retirement; the receiving realm
        // will construct its own plain records before normal public validation.
        d.snapshotJSON = JSON.stringify(d.snapshot);
        d.sourceText = d.sourceLive.querySelector('p').firstChild;
        d.pendingLink = d.toolbar.shadowRoot.querySelector('[part~=link-editor]');
        if (d.sourceText?.nodeType !== 3 || d.sourceText.textContent !== 'Alpha ' || !d.pendingLink) throw new Error('Expected retained source Text and pending Link UI.');
        d.sourceBefore = model(source);
        d.retiredSource = () => ({sourceConnected: source.isConnected, sourceOwnerUnchanged: source.ownerDocument === d.sourceOwner && d.sourceOwner === document,
          sourceRootUnchanged: source.shadowRoot === d.sourceRoot, sourceLiveConnected: d.sourceLive.isConnected,
          sourceLiveRetired: !d.sourceRoot.contains(d.sourceLive), sourceTextConnected: d.sourceText.isConnected,
          sourceLiveOwnerUnchanged: d.sourceLive.ownerDocument === d.sourceOwner,
          sourceTextOwnerUnchanged: d.sourceText.ownerDocument === d.sourceOwner, sourceText: d.sourceText.textContent});
        (window as any).stateTransferFixture = d;
        return {model: d.sourceBefore, bookmarkRevision: d.bookmark.revision, registry: f.state().actual};
      });
      expect(evidence.source).toMatchObject({model: {revision: 2, undoEnabled: true, redoEnabled: false, composing: false}, bookmarkRevision: 2});
      // Disposing the toolbar explicitly releases its pending association/intent.
      // Source removal alone does not promise automatic toolbar cancellation.
      evidence.retirement = await page.evaluate(() => {
        const d = (window as any).stateTransferFixture;
        d.toolbar.remove(); d.source.remove();
        d.sourceDetached = d.model(d.source);
        return {model: d.sourceDetached, ownership: d.retiredSource(), toolbarConnected: d.toolbar.isConnected,
          toolbarOwnerUnchanged: d.toolbar.ownerDocument === d.sourceOwner, pendingLinkConnected: d.pendingLink.isConnected,
          destinationAbsent: !document.querySelector('#state-transfer-frame')};
      });
      expect(evidence.retirement).toMatchObject({toolbarConnected: false, toolbarOwnerUnchanged: true, pendingLinkConnected: false, destinationAbsent: true,
        ownership: {sourceConnected: false, sourceOwnerUnchanged: true, sourceRootUnchanged: true, sourceLiveConnected: false, sourceLiveRetired: true,
          sourceTextConnected: false, sourceLiveOwnerUnchanged: true, sourceTextOwnerUnchanged: true, sourceText: 'Alpha '}});
      // Commands are unavailable without a view; this does not assert that source history was erased.
      expect(evidence.retirement.model).toEqual({...evidence.source.model, undoEnabled: false, redoEnabled: false});
      await expect.poll(() => page.evaluate(() => {
        const d = (window as any).stateTransferFixture;
        return d.toolbar.shadowRoot.querySelector('[part~=link-editor]') === null;
      })).toBe(true);
      evidence.retired = await page.evaluate(() => {
        const d = (window as any).stateTransferFixture;
        document.querySelector<HTMLInputElement>('#essential')!.focus();
        return {model: d.model(d.source), ownership: d.retiredSource(), linkEditorAbsent: !d.toolbar.shadowRoot.querySelector('[part~=link-editor]'),
          toolbarOpen: d.toolbar.shadowRoot.querySelector('[part~=base]')?.matches(':popover-open') ?? false,
          destinationAbsent: !document.querySelector('#state-transfer-frame')};
      });
      expect(evidence.retired).toMatchObject({linkEditorAbsent: true, toolbarOpen: false, destinationAbsent: true});
      expect(evidence.retired.model).toEqual(evidence.retirement.model); expect(evidence.retired.ownership).toEqual(evidence.retirement.ownership);
      await expect(page.locator('#essential')).toBeFocused();
      // The destination browsing context and its editor are created only after retirement is complete.
      await page.evaluate(mode => {
        const d = (window as any).stateTransferFixture, iframe = document.createElement('iframe'); iframe.id = 'state-transfer-frame';
        iframe.src = `/index.html?boundary=nested${mode === 'global' ? '&global' : ''}`; document.body.append(iframe); d.iframe = iframe;
      }, mode);
      const frame = page.frameLocator('#state-transfer-frame'), destination = frame.locator('#editor-0');
      const destinationControl = destination.getByRole('textbox');
      await expect(destinationControl).toHaveAttribute('contenteditable', 'true');
      await expect(page.locator('#essential')).toBeFocused();
      evidence.transfer = await page.evaluate(async () => {
        const d = (window as any).stateTransferFixture, f = (d.iframe.contentWindow as any).editorFixture;
        const target = f.entries[0].editor; d.target = target; d.targetLive = target.shadowRoot.querySelector('[contenteditable="true"]');
        d.targetOwner = target.ownerDocument;
        const destinationWindow = d.iframe.contentWindow as any;
        const transferred = destinationWindow.JSON.parse(d.snapshotJSON);
        d.transferEncoding = {serializedBeforeRetirement: d.snapshotJSON === JSON.stringify(d.sourceBefore.document),
          destinationRecord: Object.getPrototypeOf(transferred) === destinationWindow.Object.prototype,
          destinationDocumentRecord: Object.getPrototypeOf(transferred.doc) === destinationWindow.Object.prototype,
          exactRoundTrip: destinationWindow.JSON.stringify(transferred) === d.snapshotJSON};
        target.document = transferred; await target.updateComplete;
        d.targetText = d.targetLive.querySelector('p').firstChild;
        if (d.targetText?.nodeType !== 3 || d.targetText.textContent !== 'Alpha ') throw new Error('Expected the transferred leading Text.');
        d.ownership = () => ({...d.retiredSource(), targetConnected: target.isConnected,
          targetOwnerUnchanged: target.ownerDocument === d.targetOwner && d.targetOwner === d.iframe.contentDocument,
          separateRealms: d.sourceOwner.defaultView !== d.targetOwner.defaultView,
          targetLiveUnchanged: target.shadowRoot.querySelector('[contenteditable="true"]') === d.targetLive});
        d.native = () => {
          const owner = target.ownerDocument, native = owner.getSelection();
          if (!native || typeof native.getComposedRanges !== 'function' || !('direction' in native)) throw new Error('Native composed selection and direction are required.');
          const text = d.targetText;
          return {text: native.toString().slice(0, 256), direction: native.direction,
            leadingNodeIsText: text?.nodeType === 3, leadingText: text?.textContent?.slice(0, 256), sameLeadingText: d.targetLive.querySelector('p').firstChild === text,
            focused: target.shadowRoot.activeElement === d.targetLive, ownerFocused: owner.hasFocus(),
            ranges: native.getComposedRanges({shadowRoots: [target.shadowRoot]}).slice(0, 8).map((range: StaticRange) => {
              const copy = owner.createRange(); copy.setStart(range.startContainer, range.startOffset); copy.setEnd(range.endContainer, range.endOffset);
              return {sameStart: range.startContainer === text, sameEnd: range.endContainer === text,
                startOffset: range.startOffset, endOffset: range.endOffset, collapsed: range.collapsed, text: copy.toString().slice(0, 256)};
            })};
        };
        d.targetLive.addEventListener('keydown', (event: KeyboardEvent) => d.keys.push({key: event.key, trusted: event.isTrusted,
          shift: event.shiftKey, ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey}), {capture: true});
        const before = d.model(target), sourceBefore = d.model(d.source);
        // Keep the original opaque object in the browser realm. Playwright serialization would independently break ownership.
        const acceptedForeignBookmark = target.restoreBookmark(d.bookmark);
        return {before, after: d.model(target), sourceBefore, sourceAfter: d.model(d.source), acceptedForeignBookmark, encoding: d.transferEncoding,
          bookmarkRevision: d.bookmark.revision, enabled: !target.disabled && !target.readOnly,
          sameDocumentData: JSON.stringify(target.document) === JSON.stringify(d.snapshot), ownership: d.ownership(), registry: f.state().actual};
      });
      expect(evidence.transfer.before).toMatchObject({revision: 2, value: 'Alpha beta gamma', undoEnabled: false, redoEnabled: false,
        composing: false, hasSelection: false, range: {coordinate: 'structured', from: 1, to: 1, expectedText: ''}});
      expect(evidence.transfer.before.document).toEqual(evidence.source.model.document);
      expect(evidence.transfer).toMatchObject({acceptedForeignBookmark: false, bookmarkRevision: 2, enabled: true, sameDocumentData: true,
        encoding: {serializedBeforeRetirement: true, destinationRecord: true, destinationDocumentRecord: true, exactRoundTrip: true},
        ownership: {...evidence.retired.ownership, targetConnected: true, targetOwnerUnchanged: true,
          separateRealms: true, targetLiveUnchanged: true}});
      expect(evidence.transfer.after).toEqual(evidence.transfer.before);
      expect(evidence.transfer.sourceBefore).toEqual(evidence.retired.model);
      expect(evidence.transfer.sourceAfter).toEqual(evidence.retired.model);
      await expect(page.locator('#essential')).toBeFocused();
      await expect(destination.locator('strong')).toHaveText('beta');

      // Adopt only the used toolbar, after retargeting its public command owner.
      evidence.retarget = await page.evaluate(async () => {
        const d = (window as any).stateTransferFixture, targetFixture = (d.iframe.contentWindow as any).editorFixture;
        targetFixture.entries[0].toolbar.remove(); d.toolbar.editor = d.target; d.toolbar.id = 'state-transfer-toolbar';
        d.targetOwner.body.append(d.toolbar); await d.toolbar.updateComplete;
        document.querySelector<HTMLInputElement>('#essential')!.focus();
        return {source: d.model(d.source), target: d.model(d.target), ownership: d.ownership(),
          toolbarDestinationOwned: d.toolbar.ownerDocument === d.targetOwner, toolbarTargetsDestination: d.toolbar.editor === d.target};
      });
      const movedToolbar = frame.locator('#state-transfer-toolbar');
      await expect(movedToolbar.getByRole('textbox', {name: 'Link URL'})).toHaveCount(0);
      await expect(movedToolbar.locator('[part~=base][popover=manual]')).not.toBeVisible();
      await expect(page.locator('#essential')).toBeFocused();
      expect(await page.evaluate(() => (window as any).stateTransferFixture.sourceRoot.querySelectorAll('a').length)).toBe(0); await expect(destination.locator('a')).toHaveCount(0);
      expect(evidence.retarget).toMatchObject({toolbarDestinationOwned: true, toolbarTargetsDestination: true});
      expect(evidence.retarget.source).toEqual(evidence.retired.model);
      expect(evidence.retarget.target).toEqual(evidence.transfer.before);
      expect(evidence.retarget.ownership).toEqual(evidence.transfer.ownership);

      await destinationControl.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const d = (window as any).stateTransferFixture; d.target.focus();
        const text = d.targetLive.querySelector('p').firstChild;
        if (text?.nodeType !== 3 || text.textContent !== 'Alpha ') throw new Error('Expected the destination leading Text.');
        d.targetOwner.getSelection().setBaseAndExtent(text, 1, text, 4);
      });
      await expect(destinationControl).toBeFocused();
      await expect.poll(() => destination.evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 2, to: 5, expectedText: 'lph'});
      evidence.beforeTyping = await page.evaluate(() => {const d = (window as any).stateTransferFixture; return {native: d.native(), model: d.model(d.target)};});
      expect(evidence.beforeTyping.native).toEqual({text: 'lph', direction: 'forward', leadingNodeIsText: true, leadingText: 'Alpha ', sameLeadingText: true, focused: true, ownerFocused: true,
        ranges: [{sameStart: true, sameEnd: true, startOffset: 1, endOffset: 4, collapsed: false, text: 'lph'}]});
      expect(evidence.beforeTyping.model).toMatchObject({value: 'Alpha beta gamma', revision: 2, undoEnabled: false});
      await page.keyboard.press('x');
      await expect(destination).toHaveJSProperty('value', 'Axa beta gamma');
      await expect.poll(() => destination.evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 3, to: 3, expectedText: ''});
      evidence.afterTyping = await page.evaluate(() => {
        const d = (window as any).stateTransferFixture; d.targetAfterTyping = d.model(d.target);
        return {native: d.native(), model: d.targetAfterTyping, source: d.model(d.source), ownership: d.ownership(), keys: d.keys};
      });
      expect(evidence.afterTyping.native).toMatchObject({text: '', leadingNodeIsText: true, leadingText: 'Axa ', sameLeadingText: true, focused: true, ownerFocused: true,
        ranges: [{sameStart: true, sameEnd: true, startOffset: 2, endOffset: 2, collapsed: true, text: ''}]});
      expect(evidence.afterTyping.model).toMatchObject({value: 'Axa beta gamma', revision: 3, hasSelection: false, undoEnabled: true, composing: false});
      expect(evidence.afterTyping.keys).toEqual([{key: 'x', trusted: true, shift: false, ctrl: false, meta: false, alt: false}]);
      expect(evidence.afterTyping.source).toEqual(evidence.retired.model);
      expect(evidence.afterTyping.ownership).toEqual(evidence.transfer.ownership);
      await expect(destination.locator('strong')).toHaveText('beta');
      await expect(destination.locator('a')).toHaveCount(0);

      evidence.sourceWrite = await page.evaluate(() => {
        const d = (window as any).stateTransferFixture; d.source.value = 'Source replacement'; d.sourceAfterWrite = d.model(d.source);
        return {source: d.sourceAfterWrite, target: d.model(d.target), sourceSnapshotUnchanged: JSON.stringify(d.snapshot) === JSON.stringify(d.sourceBefore.document)};
      });
      expect(evidence.sourceWrite.source).toMatchObject({value: 'Source replacement', undoEnabled: false, redoEnabled: false});
      expect(evidence.sourceWrite.target).toEqual(evidence.afterTyping.model);
      expect(evidence.sourceWrite.sourceSnapshotUnchanged).toBe(true);
      expect(await page.evaluate(() => (window as any).stateTransferFixture.source.value)).toBe('Source replacement');

      // A fresh target-owned intent starts with an empty URL and applies only to the destination selection.
      await page.evaluate(() => {
        const d = (window as any).stateTransferFixture; d.target.focus();
        const text = d.targetLive.querySelector('p').firstChild;
        if (text?.nodeType !== 3 || text.textContent !== 'Axa ') throw new Error('Expected the independently edited destination Text.');
        d.targetOwner.getSelection().setBaseAndExtent(text, 1, text, 3);
      });
      await expect.poll(() => destination.evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 2, to: 4, expectedText: 'xa'});
      await expect(movedToolbar.getByRole('button', {name: 'Link', exact: true})).toBeVisible();
      await movedToolbar.getByRole('button', {name: 'Link', exact: true}).click();
      const freshField = movedToolbar.getByRole('textbox', {name: 'Link URL'});
      await expect(freshField).toBeFocused(); await expect(freshField).toHaveValue('');
      await freshField.fill('https://example.com/destination');
      await movedToolbar.getByRole('button', {name: 'Apply link'}).click();
      await expect(destination.locator('a')).toHaveText('xa');
      await expect(destination.locator('a')).toHaveAttribute('href', 'https://example.com/destination');
      expect(await page.evaluate(() => (window as any).stateTransferFixture.sourceRoot.querySelectorAll('a').length)).toBe(0);
      await expect(destination.locator('strong')).toHaveText('beta');
      evidence.afterLink = await page.evaluate(() => {
        const d = (window as any).stateTransferFixture;
        return {source: d.model(d.source), target: d.model(d.target), ownership: d.ownership()};
      });
      expect(evidence.afterLink.source).toEqual(evidence.sourceWrite.source);
      expect(evidence.afterLink.target).toMatchObject({value: 'Axa beta gamma', composing: false});
      expect(evidence.afterLink.ownership).toEqual(evidence.transfer.ownership);
    } catch (error) {failed = true; throw error;}
    finally {
      try {
        evidence.final = await page.evaluate(() => {
          const d = (window as any).stateTransferFixture;
          if (!d) return {setupReached: false};
          const final: Record<string, any> = {toolbarConnected: d.toolbar.isConnected,
            toolbarTargetsDestination: d.toolbar.editor === d.target, keys: d.keys.slice(0, 32), transferEncoding: d.transferEncoding ?? null};
          for (const [key, read] of [
            ['source', () => d.model(d.source)], ['target', () => d.target ? d.model(d.target) : null],
            ['retiredSource', () => d.retiredSource()], ['ownership', () => d.ownership?.() ?? null], ['native', () => d.native?.() ?? null],
          ] as const) {
            try {final[key] = read();} catch (error) {final[`${key}Error`] = String(error);}
          }
          return final;
        });
      } catch (error) {evidence.finalReadError = String(error);}
      try {await info.attach('fresh-destination-document-transfer', {body: JSON.stringify(evidence), contentType: 'application/json'});}
      catch (error) {if (!failed) throw error;}
    }
  });
}


// Public callbacks may author a document while a view is being created or retired.
// These cases inspect retained native nodes; they never read the backend view.
for (const mode of ['auto', 'global']) {
  test(`${mode}: renderer and abort author writes survive mount and immediate same-document reconnect`, async ({page}, info) => {
    const evidence: Record<string, any> = {mode}; let failed = false;
    try {
    await open(page, mode);
    await page.locator('#essential').focus();
    await page.evaluate(() => {
      const f = (window as any).editorFixture, host = f.scope.createElement('en-rich-text-editor');
      host.id = 'reentrant-editor'; host.label = 'Reentrant editor';
      const documentFor = (text: string) => ({type: 'en-rich-text', version: 1, doc: {type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text}]}]}});
      const d: any = f.reentrancy = {host, documentFor, changes: 0, renderCalls: 0, abortCalls: 0, oldFocusEvents: 0, keys: [] as unknown[], rendererWrite: null as unknown};
      host.addEventListener('en-change', () => d.changes++);
      host.document = {type: 'en-rich-text', version: 1, doc: {type: 'doc', content: [{type: 'paragraph', content: [
        {type: 'token', attrs: {run: {kind: 'token', id: 'mount-token', type: 'mount-author', text: '@stale', label: 'Stale mount token', data: null}}},
      ]}]}};
      d.initialRevision = host.revision;
      host.registerToken('mount-author', (run: any) => {
        d.renderCalls++;
        const content = host.ownerDocument.createElement('span'); content.textContent = run.text;
        d.renderedContent = content;
        if (d.renderCalls === 1) {
          host.document = documentFor('Renderer author wins');
          d.rendererWrite = {value: host.value, draft: host.draftValue, revision: host.revision, changes: d.changes};
        }
        return content;
      });
      document.querySelector('#editors')!.append(host);
    });
    const target = page.locator('#reentrant-editor'), native = target.getByRole('textbox');
    await expect(native).toHaveAttribute('contenteditable', 'true');
    await expect(native).toHaveText('Renderer author wins');
    await expect(target).toHaveJSProperty('value', 'Renderer author wins');
    await expect(page.locator('#essential')).toBeFocused();
    const mounted = await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, host = d.host;
      d.root = host.shadowRoot; d.live = d.root.querySelector('[contenteditable="true"]'); d.text = d.live.querySelector('p').firstChild;
      return {renderCalls: d.renderCalls, rendererWrite: d.rendererWrite, revisionDelta: host.revision - d.initialRevision,
        document: host.document, value: host.value, draft: host.draftValue, changes: d.changes,
        nativeText: d.text.textContent, textNode: d.text.nodeType === Node.TEXT_NODE,
        liveCount: d.root.querySelectorAll('[contenteditable="true"]').length,
        staleContentConnected: d.renderedContent.isConnected, staleContentInRoot: d.root.contains(d.renderedContent),
        tokenCount: d.root.querySelectorAll('[part~=token]').length, undo: host.getCommandState('undo').enabled};
    });
    evidence.mounted = mounted;
    expect(mounted).toMatchObject({renderCalls: 1, rendererWrite: {value: 'Renderer author wins', draft: 'Renderer author wins', changes: 0},
      revisionDelta: 1, value: 'Renderer author wins', draft: 'Renderer author wins', changes: 0,
      nativeText: 'Renderer author wins', textNode: true, liveCount: 1, staleContentConnected: false, staleContentInRoot: false, tokenCount: 0, undo: false});
    expect(mounted.document).toEqual({type: 'en-rich-text', version: 1, doc: {type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text: 'Renderer author wins'}]}]}});
    const retiring = await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, host = d.host, essential = document.querySelector<HTMLInputElement>('#essential')!;
      d.oldRevision = host.revision; d.parent = host.parentNode; d.next = host.nextSibling;
      d.live.addEventListener('focus', () => d.oldFocusEvents++);
      host.registerExtension({id: 'abort-author', trigger: '#', label: 'Abort author', open: (session: any) => {
        d.session = session;
        session.signal.addEventListener('abort', () => {
          d.abortCalls++;
          const disconnectedAtEntry = !host.isConnected;
          host.document = d.documentFor('Abort author wins');
          host.focus({preventScroll: true});
          const beforeAppend = {oldText: d.text.textContent, oldNativeText: d.live.textContent, oldFocusEvents: d.oldFocusEvents,
            outsideFocused: document.activeElement === essential, value: host.value, draft: host.draftValue};
          // Reconnect from the author callback itself, before the old disconnect returns.
          d.parent.insertBefore(host, d.next);
          host.focus({preventScroll: true});
          d.abortObservation = {disconnectedAtEntry, beforeAppend, connectedAfterAppend: host.isConnected,
            oldText: d.text.textContent, oldNativeText: d.live.textContent, oldFocusEvents: d.oldFocusEvents,
            outsideFocused: document.activeElement === essential, value: host.value, draft: host.draftValue};
        }, {once: true});
      }});
      const opened = host.openExtension('abort-author');
      const open = host.extensionOpen;
      essential.focus({preventScroll: true}); d.oldFocusEvents = 0;
      host.remove();
      return {opened, open, abortCalls: d.abortCalls, aborted: d.session.signal.aborted, observation: d.abortObservation,
        connected: host.isConnected, extensionOpen: host.extensionOpen, value: host.value, draft: host.draftValue,
        revisionDelta: host.revision - d.oldRevision, changes: d.changes, outsideFocused: document.activeElement === essential};
    });
    evidence.retiring = retiring;
    expect(retiring).toEqual({opened: true, open: true, abortCalls: 1, aborted: true,
      observation: {disconnectedAtEntry: true, beforeAppend: {oldText: 'Renderer author wins', oldNativeText: 'Renderer author wins', oldFocusEvents: 0,
        outsideFocused: true, value: 'Abort author wins', draft: 'Abort author wins'}, connectedAfterAppend: true,
        oldText: 'Renderer author wins', oldNativeText: 'Renderer author wins', oldFocusEvents: 0,
        outsideFocused: true, value: 'Abort author wins', draft: 'Abort author wins'},
      connected: true, extensionOpen: false, value: 'Abort author wins', draft: 'Abort author wins', revisionDelta: 1, changes: 0, outsideFocused: true});
    await expect(native).toHaveAttribute('contenteditable', 'true');
    await expect(native).toHaveText('Abort author wins');
    await expect(page.locator('#essential')).toBeFocused();
    const reconnected = await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, host = d.host, live = host.shadowRoot.querySelector('[contenteditable="true"]');
      d.currentLive = live; d.currentText = live.querySelector('p').firstChild;
      live.addEventListener('keydown', (event: KeyboardEvent) => d.keys.push({key: event.key, trusted: event.isTrusted}));
      const staleCommit = d.session.commit({id: 'stale', label: 'Stale', insert: [{kind: 'text', text: 'stale'}]});
      return {sameHost: document.querySelector('#reentrant-editor') === host, sameRoot: host.shadowRoot === d.root,
        freshLive: live !== d.live, freshText: d.currentText !== d.text, oldLiveConnected: d.live.isConnected,
        oldText: d.text.textContent, oldFocusEvents: d.oldFocusEvents, liveCount: host.shadowRoot.querySelectorAll('[contenteditable="true"]').length,
        value: host.value, draft: host.draftValue, changes: d.changes, revisionDelta: host.revision - d.oldRevision,
        aborted: d.session.signal.aborted, staleCommit,
        extensionOpen: host.extensionOpen, undo: host.getCommandState('undo').enabled};
    });
    evidence.reconnected = reconnected;
    expect(reconnected).toEqual({sameHost: true, sameRoot: true, freshLive: true, freshText: true, oldLiveConnected: false,
      oldText: 'Renderer author wins', oldFocusEvents: 0, liveCount: 1, value: 'Abort author wins', draft: 'Abort author wins', changes: 0,
      revisionDelta: 1, aborted: true, staleCommit: false, extensionOpen: false, undo: false});
    // A real key on the newly mounted native surface proves editing resumed.
    await target.evaluate((host: any) => host.focus({preventScroll: true}));
    await expect(native).toBeFocused();
    await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, length = d.currentText.textContent.length;
      document.getSelection()!.setBaseAndExtent(d.currentText, length, d.currentText, length);
    });
    await expect.poll(() => target.evaluate((host: any) => host.captureRange())).toMatchObject({coordinate: 'structured', from: 18, to: 18, expectedText: ''});
    const caret = await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, selection = document.getSelection()! as any;
      return selection.getComposedRanges({shadowRoots: [d.root]}).map((range: StaticRange) => ({sameStart: range.startContainer === d.currentText,
        sameEnd: range.endContainer === d.currentText, start: range.startOffset, end: range.endOffset, collapsed: range.collapsed}));
    });
    evidence.caret = caret;
    expect(caret).toEqual([{sameStart: true, sameEnd: true, start: 17, end: 17, collapsed: true}]);
    await page.keyboard.press('x');
    await expect(target).toHaveJSProperty('value', 'Abort author winsx');
    await expect(native).toHaveText('Abort author winsx');
    const edited = await page.evaluate(() => {
      const d = (window as any).editorFixture.reentrancy, host = d.host;
      return {keys: d.keys, changes: d.changes, revisionDelta: host.revision - d.oldRevision,
        value: host.value, draft: host.draftValue, undo: host.getCommandState('undo').enabled,
        sameLive: host.shadowRoot.querySelector('[contenteditable="true"]') === d.currentLive,
        oldText: d.text.textContent, oldFocusEvents: d.oldFocusEvents, abortCalls: d.abortCalls};
    });
    evidence.edited = edited;
    expect(edited).toEqual({keys: [{key: 'x', trusted: true}], changes: 1, revisionDelta: 2,
      value: 'Abort author winsx', draft: 'Abort author winsx', undo: true, sameLive: true,
      oldText: 'Renderer author wins', oldFocusEvents: 0, abortCalls: 1});
    } catch (error) {failed = true; throw error;}
    finally {
      // Observation only: do not focus, mutate, wait, or turn an earlier failure into a pass.
      try {
        evidence.finalObservation = await page.evaluate(() => {
          const d = (window as any).editorFixture?.reentrancy;
          if (!d) return {fixturePresent: false, errors: []};
          const errors: {field: string; error: string}[] = [], host = d.host, root = host.shadowRoot;
          const read = (field: string, inspect: () => unknown) => {
            try {return inspect();} catch (error) {errors.push({field, error: String(error).slice(0, 1024)}); return null;}
          };
          const currentLive = root?.querySelector('[contenteditable="true"]');
          return {fixturePresent: true, connected: host.isConnected, renderCalls: d.renderCalls, abortCalls: d.abortCalls,
            changes: d.changes, oldFocusEvents: d.oldFocusEvents, keys: d.keys.slice(-8),
            public: read('public', () => ({value: host.value.slice(0, 256), draft: host.draftValue.slice(0, 256), revision: host.revision,
              range: host.captureRange(), extensionOpen: host.extensionOpen, undo: host.getCommandState('undo').enabled})),
            retained: read('retained', () => ({sameRoot: !d.root || root === d.root, oldLiveConnected: d.live?.isConnected ?? null,
              oldText: d.text?.textContent?.slice(0, 256) ?? null, oldNativeText: d.live?.textContent?.slice(0, 256) ?? null,
              currentNativeText: currentLive?.textContent?.slice(0, 256) ?? null, currentLiveIsOriginal: currentLive === d.live,
              currentLiveIsReconnected: currentLive === d.currentLive, liveCount: root?.querySelectorAll('[contenteditable="true"]').length ?? 0,
              outsideFocused: document.activeElement === document.querySelector('#essential')})),
            native: read('native', () => {
              const selection = host.ownerDocument.getSelection() as any;
              return selection && {text: selection.toString().slice(0, 256), direction: selection.direction, rangeCount: selection.rangeCount,
                composedRangesSupported: typeof selection.getComposedRanges === 'function',
                ranges: root && typeof selection.getComposedRanges === 'function' ? selection.getComposedRanges({shadowRoots: [root]}).slice(0, 4).map((range: StaticRange) => ({
                  startIsOriginalText: range.startContainer === d.text, endIsOriginalText: range.endContainer === d.text,
                  startIsCurrentText: range.startContainer === d.currentText, endIsCurrentText: range.endContainer === d.currentText,
                  start: range.startOffset, end: range.endOffset, collapsed: range.collapsed})) : null};
            }), errors};
        });
      } catch (error) {evidence.finalObservationError = String(error).slice(0, 1024);}
      try {await info.attach('public-renderer-abort-reentrancy', {body: JSON.stringify(evidence), contentType: 'application/json'});}
      catch (error) {
        if (!failed) throw error;
        info.annotations.push({type: 'reentrancy-evidence-attachment-error', description: String(error).slice(0, 1024)});
      }
      if (!failed && (evidence.finalObservationError || evidence.finalObservation?.errors.length)) {
        throw new Error(`Reentrancy final observation failed: ${JSON.stringify(evidence.finalObservationError ?? evidence.finalObservation.errors)}`);
      }
    }
  });
}

