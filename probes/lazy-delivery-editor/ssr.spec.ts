import {test, expect, type Page, type TestInfo} from '@playwright/test';

async function open(page: Page, mode: string, presence = 'present') {
  await page.goto(`/ssr-${mode}-${presence}.html`);
  await page.waitForFunction(() => Boolean((window as any).ssrEditorFixture));
}

async function mountEditor(page: Page, info: TestInfo) {
  const readonlySelection = await page.evaluate(() => {
    const f = (window as any).ssrEditorFixture;
    const node = f.ssrControl.querySelector('p').firstChild;
    const selection = document.getSelection()!;
    selection.setBaseAndExtent(node, 0, node, 5);
    return {text: selection.toString(), anchorOffset: selection.anchorOffset, focusOffset: selection.focusOffset, readonly: f.ssrControl.getAttribute('aria-readonly')};
  });
  await page.evaluate(() => (window as any).ssrEditorFixture.mountEditor());
  const baseline = await page.evaluate(() => {
    const f = (window as any).ssrEditorFixture;
    return {initial: f.initial, backend: f.backend, nativeScopes: f.nativeScopes, mode: f.editorIsland.mode};
  });
  expect(baseline.initial.readonly).toBe('true');
  expect(baseline.initial.contenteditable).not.toBe('true');
  expect(baseline.backend).toEqual({replacedSSRControl: true, editable: 'true', text: 'Alpha beta gamma'});
  // Native selection in readonly SSR text is observed separately; the existing
  // essential backend mount replaces that node and does not promise its selection.
  await info.attach('essential-editor-mount-baseline', {body: JSON.stringify({readonlySelection, ...baseline}), contentType: 'application/json'});
}

async function selectText(page: Page, backward = false) {
  const editor = page.locator('en-rich-text-editor');
  const editable = editor.locator('[part~="control"][contenteditable="true"]');
  // Treat public focus and the intended native selection as one fixture action.
  const selected = await editable.evaluate((element, backwards) => {
    const root = element.getRootNode() as ShadowRoot, host = root.host as any;
    const fixture = (window as any).ssrEditorFixture;
    host.focus();
    if (root.activeElement !== element || host.shadowRoot !== root || !element.isConnected || fixture.editor !== host || fixture.live !== element) {
      throw new Error('Public focus must reach the current mounted editor control');
    }
    const node = element.querySelector('p')!.firstChild!;
    const length = node.textContent!.length;
    const selection = element.ownerDocument.getSelection()!;
    selection.setBaseAndExtent(node, backwards ? length : 0, node, backwards ? 0 : length);
    fixture.rememberNativeSelection();
    const ranges = (selection as any).getComposedRanges({shadowRoots: [root]}) as StaticRange[];
    return {text: selection.toString(), direction: (selection as any).direction, ranges: ranges.map(range => ({
      sameStart: range.startContainer === node, sameEnd: range.endContainer === node,
      start: range.startOffset, end: range.endOffset,
    }))};
  }, backward);
  expect(selected).toEqual({text: 'Alpha beta gamma', direction: backward ? 'backward' : 'forward', ranges: [{sameStart: true, sameEnd: true, start: 0, end: 16}]});
  // Observe asynchronous public adoption without rewriting the native or model range.
  await expect(editor).toHaveJSProperty('hasSelection', true);
  await expect(editable).toBeFocused();
  expect(await editor.evaluate((element: any) => element.captureRange().expectedText)).toBe('Alpha beta gamma');
  return editable;
}

async function inspect(page: Page) {
  return page.evaluate(() => (window as any).ssrEditorFixture.inspectEditor());
}

for (const mode of ['global', 'shadow']) {
  test(`${mode}: absent toolbar records essential backend mount and retains a real focused selection`, async ({page}, info) => {
    await open(page, mode, 'absent');
    await mountEditor(page, info);
    await selectText(page);
    const state = await inspect(page);
    expect(state).toMatchObject({sameHost: true, sameShadow: true, sameLiveControl: true, focused: true, value: 'Alpha beta gamma'});
    expect(state.selection.expectedText).toBe('Alpha beta gamma');
    await expect(page.locator('en-editor-toolbar')).toHaveCount(0);
  });

  test(`${mode}: toolbar hydration without selection preserves mounted editor`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page, mode);
    await mountEditor(page, info);
    const before = await inspect(page);
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.initial.generated)).toBe(1);
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar());
    expect(await inspect(page)).toEqual(before);
    expect(await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      return {state: f.toolbarIsland.state, generated: f.toolbar.shadowRoot.querySelectorAll('en-toolbar').length, commands: f.toolbar.shadowRoot.querySelectorAll('en-button').length};
    })).toEqual({state: 'ready', generated: 1, commands: 4});
    expect(errors).toEqual([]);
  });

  for (const backward of [false, true]) test(`${mode}: independently hydrate toolbar after ${backward ? 'backward' : 'forward'} editor selection`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text()); });
    await open(page, mode);
    await mountEditor(page, info);
    const editable = await selectText(page, backward);
    const before = await inspect(page);
    await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      f.toolbarShadow = f.toolbar.shadowRoot;
      f.toolbarBase = f.toolbar.shadowRoot.querySelector('[part~="base"]');
      f.toolbarSlot = f.toolbar.shadowRoot.querySelector('slot');
    });
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar());
    const toolbar = page.locator('en-editor-toolbar');
    await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
    await expect(editable).toBeFocused();
    expect(await inspect(page)).toEqual(before);
    expect(await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      return {
        state: f.toolbarIsland.state, sameShadow: f.toolbar.shadowRoot === f.toolbarShadow,
        sameBase: f.toolbar.shadowRoot.querySelector('[part~="base"]') === f.toolbarBase,
        sameSlot: f.toolbar.shadowRoot.querySelector('slot') === f.toolbarSlot,
        generated: f.toolbar.shadowRoot.querySelectorAll('en-toolbar').length,
        commands: f.toolbar.shadowRoot.querySelectorAll('en-button').length,
        owner: f.toolbar.editor === f.editor,
        registryMode: f.toolbarIsland.mode,
        expectedRegistry: f.mode === 'global' || !f.nativeScopes ? 'global' : 'scoped',
      };
    })).toMatchObject({state: 'ready', sameShadow: true, sameBase: true, sameSlot: true, generated: 1, commands: 4, owner: true});
    const registries = await page.evaluate(() => { const f = (window as any).ssrEditorFixture; return [f.toolbarIsland.mode, f.mode === 'global' || !f.nativeScopes ? 'global' : 'scoped']; });
    expect(registries[0]).toBe(registries[1]);
    await info.attach('independent-toolbar-hydration', {body: JSON.stringify({mode, backward, before, after: await inspect(page), registryMode: registries[0]}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  for (const authored of [false, true]) test(`${mode}: first-hydration focus intent reaches the ${authored ? 'authored' : 'generated'} command and preserves editor selection`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text()); });
    await open(page, mode);
    await mountEditor(page, info);
    const editable = await selectText(page);
    const before = await inspect(page);
    if (authored) await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      const button = f.scopes[1].createElement('button');
      button.type = 'button'; button.textContent = 'Authored action'; button.dataset.focusCommand = '';
      f.toolbar.append(button); f.authoredFocusCommand = button;
    });
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar({focus: true}));
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusRequest)).toEqual({
      hasUpdated: false, generated: 1, commands: 4, editorSelected: true,
    });
    const toolbar = page.locator('en-editor-toolbar');
    await expect(toolbar.getByRole('button', {name: authored ? 'Authored action' : 'Bold', exact: true})).toBeFocused();
    const after = await inspect(page);
    // Native Selection presentation can clear when focus leaves a shadow editor.
    // Public selection stays exact; editor.focus() restores the native selection
    // once the textbox owns focus again.
    const {nativeSelection: beforeNativeSelection, ...beforeEditor} = before;
    const {nativeSelection: afterNativeSelection, ...afterEditor} = after;
    expect(afterEditor).toEqual({...beforeEditor, focused: false});
    const result = await page.evaluate(authored => {
      const f = (window as any).ssrEditorFixture;
      const first = authored ? f.toolbar.querySelector('[data-focus-command]') : f.toolbar.shadowRoot.querySelector('en-button:not([disabled])');
      return {
        state: f.toolbarIsland.state,
        generated: f.toolbar.shadowRoot.querySelectorAll('en-toolbar').length,
        commands: f.toolbar.shadowRoot.querySelectorAll('en-button').length,
        firstCommandFocused: authored ? first.matches(':focus') : f.toolbar.shadowRoot.activeElement === first && first.shadowRoot.activeElement === first.shadowRoot.querySelector('button'),
        sameAuthoredControl: !authored || first === f.authoredFocusCommand,
        registryMode: f.toolbarIsland.mode,
        expectedRegistry: f.mode === 'global' || !f.nativeScopes ? 'global' : 'scoped',
        readyCount: f.counts.toolbarReady,
      };
    }, authored);
    expect(result).toMatchObject({state: 'ready', generated: 1, commands: 4, firstCommandFocused: true, sameAuthoredControl: true, readyCount: 1});
    expect(result.registryMode).toBe(result.expectedRegistry);
    await page.locator('en-rich-text-editor').evaluate((element: any) => element.focus());
    await expect(editable).toBeFocused();
    const restored = await inspect(page);
    expect(restored).toEqual(before);
    await info.attach('first-hydration-toolbar-focus', {body: JSON.stringify({mode, authored, request: await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusRequest), before, after, restored, nativeSelectionDuringFocusTransfer: {before: beforeNativeSelection, after: afterNativeSelection}, result}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${mode}: authored slot descendants keep focus until a newer outside focus owner dismisses the toolbar`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text()); });
    await open(page, mode);
    await mountEditor(page, info);
    const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
    await essential.fill('Keep the outside draft');
    const editable = await selectText(page);
    const before = await inspect(page);
    const beforeNative = await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      f.authoredNativeNode = f.live.querySelector('p').firstChild;
      f.inspectAuthoredNative = () => {
        // Observe exact shadow endpoints and native direction independently.
        const native = f.editor.ownerDocument.getSelection();
        if (!native || typeof native.getComposedRanges !== 'function' || !('direction' in native)) throw new Error('Expected native composed selection and direction support.');
        const ranges = native.getComposedRanges({shadowRoots: [f.editor.shadowRoot]});
        if (ranges.length !== 1) throw new Error('Expected exactly one native composed range.');
        const range = ranges[0], copy = f.editor.ownerDocument.createRange();
        copy.setStart(range.startContainer, range.startOffset); copy.setEnd(range.endContainer, range.endOffset);
        return {text: native.toString(), rangeText: copy.toString(), startOffset: range.startOffset, endOffset: range.endOffset, sameStart: range.startContainer === f.authoredNativeNode, sameEnd: range.endContainer === f.authoredNativeNode, collapsed: range.collapsed, direction: native.direction};
      };
      return f.inspectAuthoredNative();
    });
    await info.attach('authored-toolbar-native-selection-baseline', {body: JSON.stringify({before, beforeNative}), contentType: 'application/json'});
    expect(beforeNative).toEqual({text: 'Alpha beta gamma', rangeText: 'Alpha beta gamma', startOffset: 0, endOffset: 16, sameStart: true, sameEnd: true, collapsed: false, direction: 'forward'});
    await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      const wrapper = f.scopes[1].createElement('en-toolbar');
      wrapper.setAttribute('label', 'Authored formatting');
      const native = f.scopes[1].createElement('button');
      native.type = 'button'; native.textContent = 'Native authored action';
      const custom = f.scopes[1].createElement('en-button');
      custom.textContent = 'Custom authored action'; custom.dataset.authoredCustom = '';
      wrapper.append(native, custom); f.toolbar.append(wrapper);
      f.authoredControls = {wrapper, native, custom};
    });
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar({focus: true}));
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusRequest)).toEqual({
      hasUpdated: false, generated: 1, commands: 4, editorSelected: true,
    });
    const toolbar = page.locator('en-editor-toolbar');
    const surface = toolbar.locator('[part~="base"][popover="manual"]');
    const native = toolbar.getByRole('button', {name: 'Native authored action', exact: true});
    const custom = toolbar.getByRole('button', {name: 'Custom authored action', exact: true});
    await expect(native).toBeFocused();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await expect(native).toBeFocused();
    await expect(native).toBeVisible();
    await expect(surface).toBeVisible();
    expect(await surface.evaluate(element => element.matches(':popover-open'))).toBe(true);
    await toolbar.locator('en-button[data-authored-custom]').evaluate(async (element: any) => {
      await element.updateComplete;
      element.focus({preventScroll: true});
    });
    await expect(custom).toBeFocused();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await expect(custom).toBeFocused();
    await expect(custom).toBeVisible();
    await expect(surface).toBeVisible();
    expect(await surface.evaluate(element => element.matches(':popover-open'))).toBe(true);
    const during = await inspect(page);
    const {nativeSelection: _beforeNative, ...beforeEditor} = before;
    const {nativeSelection: _duringNative, ...duringEditor} = during;
    expect(duringEditor).toEqual({...beforeEditor, focused: false});
    await toolbar.evaluate((element: any) => {
      element.focus({preventScroll: true});
      element.ownerDocument.querySelector('body > label input').focus();
    });
    await expect(essential).toBeFocused();
    await expect(surface).toBeHidden();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await expect(essential).toBeFocused();
    await expect(essential).toHaveValue('Keep the outside draft');
    expect(await surface.evaluate(element => element.matches(':popover-open'))).toBe(false);
    const after = await inspect(page);
    const {nativeSelection: _afterNative, ...afterEditor} = after;
    expect(afterEditor).toEqual({...beforeEditor, focused: false});
    const retained = await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture, a = f.authoredControls;
      return {
        sameWrapper: f.toolbar.firstElementChild === a.wrapper,
        sameNative: a.wrapper.firstElementChild === a.native,
        sameCustom: a.wrapper.lastElementChild === a.custom,
        generated: f.toolbar.shadowRoot.querySelectorAll('en-toolbar').length,
        commands: f.toolbar.shadowRoot.querySelectorAll('en-button').length,
      };
    });
    expect(retained).toEqual({sameWrapper: true, sameNative: true, sameCustom: true, generated: 1, commands: 4});
    await page.locator('en-rich-text-editor').evaluate((element: any) => element.focus());
    await expect(editable).toBeFocused();
    const restored = await inspect(page);
    const restoredNative = await page.evaluate(() => (window as any).ssrEditorFixture.inspectAuthoredNative());
    await info.attach('authored-toolbar-native-selection', {body: JSON.stringify({before, restored, beforeNative, restoredNative}), contentType: 'application/json'});
    const {nativeSelection: _restoredProjection, ...restoredEditor} = restored;
    expect(restoredEditor).toEqual(beforeEditor);
    expect(restoredNative).toEqual(beforeNative);
    await info.attach('authored-toolbar-focus-ownership', {body: JSON.stringify({mode, before, during, after, restored, retained}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${mode}: moving focus outside after an early toolbar request preserves the newer focus owner`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text()); });
    await open(page, mode);
    await mountEditor(page, info);
    const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
    await essential.fill('New focus owner draft');
    await selectText(page);
    const before = await inspect(page);
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar({focus: true, moveFocusToEssential: true}));
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusRequest)).toEqual({
      hasUpdated: false, generated: 1, commands: 4, editorSelected: true,
    });
    await expect(essential).toBeFocused();
    await expect(essential).toHaveValue('New focus owner draft');
    await page.evaluate(async () => {
      const f = (window as any).ssrEditorFixture;
      while (!await f.toolbar.updateComplete) { /* Finish any eligibility update. */ }
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    await expect(essential).toBeFocused();
    await expect(page.locator('en-editor-toolbar [popover]')).toBeHidden();
    const after = await inspect(page);
    expect(after).toMatchObject({
      sameHost: true, sameShadow: true, sameLiveControl: true, focused: false,
      value: before.value, revision: before.revision, selection: before.selection, selectionKey: before.selectionKey,
    });
    const result = await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      return {state: f.toolbarIsland.state, readyCount: f.counts.toolbarReady, registryMode: f.toolbarIsland.mode,
        expectedRegistry: f.mode === 'global' || !f.nativeScopes ? 'global' : 'scoped'};
    });
    expect(result).toMatchObject({state: 'ready', readyCount: 1});
    expect(result.registryMode).toBe(result.expectedRegistry);
    await info.attach('superseded-first-hydration-toolbar-focus', {body: JSON.stringify({mode, before, after, result}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${mode}: same-document immediate reconnect cancels an earlier focus request`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text()); });
    await open(page, mode);
    await mountEditor(page, info);
    const editable = await selectText(page);
    const before = await inspect(page);
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar({focus: true, reconnect: true}));
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusRequest)).toEqual({
      hasUpdated: false, generated: 1, commands: 4, editorSelected: true,
    });
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbarFocusReconnect)).toEqual({
      sameParent: true, sameDocument: true, connected: true,
    });
    await expect(page.locator('en-editor-toolbar').getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
    await page.evaluate(async () => {
      const f = (window as any).ssrEditorFixture;
      while (!await f.toolbar.updateComplete) { /* Reconnection keeps current eligibility. */ }
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    await expect(editable).toBeFocused();
    expect(await inspect(page)).toEqual(before);
    const result = await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      return {sameHost: f.roots[1].querySelector('en-editor-toolbar') === f.toolbar,
        owner: f.toolbar.editor === f.editor, generated: f.toolbar.shadowRoot.querySelectorAll('en-toolbar').length,
        commands: f.toolbar.shadowRoot.querySelectorAll('en-button').length,
        state: f.toolbarIsland.state, readyCount: f.counts.toolbarReady, registryMode: f.toolbarIsland.mode,
        expectedRegistry: f.mode === 'global' || !f.nativeScopes ? 'global' : 'scoped'};
    });
    expect(result).toMatchObject({sameHost: true, owner: true, generated: 1, commands: 4, state: 'ready', readyCount: 1});
    expect(result.registryMode).toBe(result.expectedRegistry);
    await info.attach('reconnected-first-hydration-toolbar-focus', {body: JSON.stringify({mode, before, after: await inspect(page), result}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${mode}: selection preserves eager control identity and live editor selection`, async ({page}, info) => {
    await open(page, mode);
    await mountEditor(page, info);
    await page.evaluate(() => (window as any).ssrEditorFixture.hydrateToolbar());
    expect(await page.evaluate(() => (window as any).ssrEditorFixture.toolbar.shadowRoot.querySelectorAll('en-toolbar').length)).toBe(1);
    await expect(page.locator('en-editor-toolbar [popover]')).toBeHidden();
    await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      f.generatedToolbar = f.toolbar.shadowRoot.querySelector('en-toolbar');
      f.generatedButtons = [...f.toolbar.shadowRoot.querySelectorAll('en-button')];
    });
    const editable = await selectText(page);
    const toolbar = page.locator('en-editor-toolbar');
    await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
    await expect(editable).toBeFocused();
    const before = await inspect(page);
    expect(before).toMatchObject({sameHost: true, sameShadow: true, sameLiveControl: true, focused: true, nativeSelection: {sameAnchor: true, sameFocus: true}});
    await toolbar.getByRole('button', {name: 'Bold', exact: true}).click();
    await expect(page.locator('en-rich-text-editor strong')).toHaveText('Alpha beta gamma');
    await expect(editable).toBeFocused();
    await page.evaluate(() => (window as any).ssrEditorFixture.editor.execute('undo'));
    await expect(page.locator('en-rich-text-editor strong')).toHaveCount(0);
    await expect(editable).toBeFocused();
    expect(await page.evaluate(() => {
      const f = (window as any).ssrEditorFixture;
      return {sameToolbar: f.generatedToolbar === f.toolbar.shadowRoot.querySelector('en-toolbar'), sameButtons: f.generatedButtons.every((node: Node, index: number) => node === f.toolbar.shadowRoot.querySelectorAll('en-button')[index]), sameLive: f.inspectEditor().sameLiveControl};
    })).toEqual({sameToolbar: true, sameButtons: true, sameLive: true});
    expect((await inspect(page)).selection.expectedText).toBe(before.selection.expectedText);
  });

  test(`${mode}: readonly SSR text and native fallback remain available without JavaScript`, async ({browser}, info) => {
    const context = await browser.newContext({javaScriptEnabled: false, baseURL: info.project.use.baseURL});
    try {
      const page = await context.newPage();
      await page.goto(`/ssr-${mode}-present.html`);
      await expect(page.getByRole('textbox', {name: 'SSR project brief', exact: true})).toHaveText('Alpha beta gamma');
      await expect(page.getByRole('textbox', {name: 'SSR project brief', exact: true})).toHaveAttribute('aria-readonly', 'true');
      const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
      await essential.fill('Fallback works');
      await expect(essential).toHaveValue('Fallback works');
      await expect(page.locator('en-editor-toolbar en-toolbar')).toHaveCount(1);
      await expect(page.locator('en-editor-toolbar [popover]')).toBeHidden();
    } finally { await context.close(); }
  });
}
