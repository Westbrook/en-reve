import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/probes/api-outcomes/fixture.html');
  await page.waitForFunction(() => (window as any).ready);
});

for (const tag of ['en-token-editor', 'en-rich-text-editor']) {
  test(`${tag}: drafts, composition state and accepted text`, async ({ page }) => {
    const result = await page.evaluate(async tag => {
      const editor: any = document.createElement(tag);
      editor.value = 'Hello ';
      const initial = [editor.value, editor.draftValue, editor.composing];
      document.body.append(editor);
      await editor.updateComplete;
      while (!editor.shadowRoot.querySelector('[contenteditable]')) await new Promise(r => setTimeout(r, 10));
      editor.focus();
      const input = editor.shadowRoot.querySelector('[contenteditable]');
      let during: any;
      editor.addEventListener('en-input', (e: any) => {
        during = { value: editor.value, draft: editor.draftValue, composing: editor.composing, detail: e.detail };
      });
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.textContent = 'Hello に';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', isComposing: true }));
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'に' }));
      return { initial, during };
    }, tag);
    expect(result.initial).toEqual(['Hello ', 'Hello ', false]);
    expect(result.during).toEqual({ value: 'Hello ', draft: 'Hello に', composing: true, detail: { value: 'Hello に', isComposing: true, inputType: 'insertCompositionText' } });
  });

  test(`${tag}: immutable action snapshot, veto and invalid JSON recovery`, async ({ page }) => {
    const result = await page.evaluate(async tag => {
      const editor: any = document.createElement(tag); document.body.append(editor); await editor.updateComplete;
      while (!editor.shadowRoot.querySelector('[contenteditable]')) await new Promise(r => setTimeout(r, 10));
      let session: any, received: any, events = 0;
      editor.registerExtension({ id: 'test', label: 'Test', trigger: '/', open: (s: any) => session = s });
      editor.openExtension('test');
      const provider = { nested: { names: ['original'] } };
      const listener = (e: any) => { events++; received = e.detail.data; e.preventDefault(); };
      editor.addEventListener('en-action', listener);
      const veto = session.commit({ id: 'x', label: 'X', action: 'test', data: provider, insert: [{ kind: 'text', text: 'wrong' }] });
      provider.nested.names[0] = 'changed';
      const snapshot = { detached: received !== provider, value: received.nested.names[0], frozen: Object.isFrozen(received) && Object.isFrozen(received.nested) && Object.isFrozen(received.nested.names) };
      let invalid = false;
      try { session.commit({ id: 'x', label: 'X', action: 'test', data: { bad: undefined } }); } catch (e) { invalid = e instanceof TypeError; }
      editor.removeEventListener('en-action', listener);
      const accepted = session.commit({ id: 'y', label: 'Y', action: 'test', insert: [{ kind: 'text', text: 'accepted' }] });
      return { snapshot, veto, invalid, events, accepted, value: editor.value };
    }, tag);
    expect(result).toEqual({ snapshot: { detached: true, value: 'original', frozen: true }, veto: false, invalid: true, events: 1, accepted: true, value: 'accepted' });
  });

  test(`${tag}: focus options reach the native textbox`, async ({ page }) => {
    const result = await page.evaluate(async tag => {
      const editor: any = document.createElement(tag); const before = editor.focus({ preventScroll: true });
      document.body.append(editor); await editor.updateComplete;
      while (!editor.shadowRoot.querySelector('[contenteditable]')) await new Promise(r => setTimeout(r, 10));
      const input = editor.shadowRoot.querySelector('[contenteditable]'), calls: any[] = [];
      const focus = input.focus.bind(input);
      input.focus = (options: any) => { calls.push(options); focus(options); };
      const returned = editor.focus({ preventScroll: true, focusVisible: true });
      return { before: before === undefined, returned: returned === undefined, options: calls[0], focused: editor.shadowRoot.activeElement === input };
    }, tag);
    expect(result).toEqual({ before: true, returned: true, options: { preventScroll: true, focusVisible: true }, focused: true });
  });
}

test('toolbar forwards options after its first render', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const toolbar: any = document.createElement('en-editor-toolbar');
    const button = document.createElement('button'); toolbar.append(button); document.body.append(toolbar);
    let options: any; button.focus = value => { options = value; };
    const result = toolbar.focus({ preventScroll: true }); await toolbar.updateComplete; await Promise.resolve();
    return { options, voidReturn: result === undefined };
  });
  expect(result).toEqual({ options: { preventScroll: true }, voidReturn: true });
});

for (const mode of ['commit', 'veto', 'author', 'nested', 'replace-items']) {
  test(`carousel navigation outcome: ${mode}`, async ({ page }) => {
    const result = await page.evaluate(async mode => {
      const carousel: any = document.createElement('en-carousel');
      carousel.items = ['a','b','c'].map(key => ({ key, label: key })); document.body.append(carousel); await carousel.updateComplete;
      let entered = false, nested: any;
      carousel.addEventListener('en-change', (e: any) => {
        if (entered) return; entered = true;
        if (mode === 'veto') e.preventDefault();
        if (mode === 'author') { carousel.index = 2; e.preventDefault(); }
        if (mode === 'nested') nested = carousel.requestGoToKey('c');
        if (mode === 'replace-items') carousel.items = [{ key: 'x', label: 'X' }];
      });
      const missing = carousel.requestGoToKey('missing');
      const unchanged = carousel.requestGoToKey('a');
      const outcome = carousel.requestGoToKey('b');
      const key = carousel.currentKey;
      carousel.addEventListener('en-change', (e: Event) => e.preventDefault());
      const legacy = carousel.goToKey(mode === 'replace-items' ? 'x' : 'b');
      return { missing, unchanged, outcome, key, legacy, nested };
    }, mode);
    expect(result.missing).toBe('not-found'); expect(result.unchanged).toBe('unchanged'); expect(result.legacy).toBe(true);
    expect(result.outcome).toBe(mode === 'commit' ? 'committed' : mode === 'veto' ? 'canceled' : 'superseded');
    expect(result.key).toBe(mode === 'commit' ? 'b' : mode === 'veto' ? 'a' : mode === 'replace-items' ? 'x' : 'c');
    if (mode === 'nested') expect(result.nested).toBe('committed');
  });
}

test('feed page outcomes preserve legacy committed-only Boolean', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const feed: any = document.createElement('en-activity-feed'); document.body.append(feed); await feed.updateComplete;
    const unavailable = feed.requestGoToPage(2);
    feed.items = Array.from({ length: 5 }, (_, i) => ({ key: String(i), label: String(i) })); feed.mode = 'paginated'; feed.pageSize = 2; await feed.updateComplete;
    const committed = feed.requestGoToPage(2), unchanged = feed.requestGoToPage(2), legacyUnchanged = feed.goToPage(2);
    const veto = (e: Event) => e.preventDefault(); feed.addEventListener('en-page-change', veto);
    const canceled = feed.requestGoToPage(3), legacyVeto = feed.goToPage(3);
    feed.removeEventListener('en-page-change', veto);
    feed.addEventListener('en-page-change', () => { feed.page = 1; }, { once: true });
    const superseded = feed.requestGoToPage(3);
    return { unavailable, committed, unchanged, legacyUnchanged, canceled, legacyVeto, superseded, page: feed.page, invalid: feed.requestGoToPage(NaN) };
  });
  expect(result).toEqual({ unavailable: 'unavailable', committed: 'committed', unchanged: 'unchanged', legacyUnchanged: false, canceled: 'canceled', legacyVeto: false, superseded: 'superseded', page: 1, invalid: 'unavailable' });
});

for (const tag of ['en-accordion-item', 'en-navigation', 'en-navigation-group']) {
  test(`${tag}: requestOpen, veto, nested request and silent writes`, async ({ page }) => {
    const result = await page.evaluate(async tag => {
      const disclosure: any = document.createElement(tag); document.body.append(disclosure); await disclosure.updateComplete;
      let changes = 0, toggles = 0, reason: any;
      disclosure.addEventListener('en-change', (e: any) => { changes++; reason = e.detail.reason; });
      disclosure.addEventListener('en-toggle', () => toggles++);
      const committed = disclosure.requestOpen(true), unchanged = disclosure.requestOpen(true);
      disclosure.addEventListener('en-change', (e: Event) => e.preventDefault(), { once: true });
      const canceled = disclosure.requestOpen(false);
      let entered = false;
      const nested = () => { if (entered) return; entered = true; disclosure.requestOpen(true); };
      disclosure.addEventListener('en-change', nested);
      const superseded = disclosure.requestOpen(false);
      disclosure.removeEventListener('en-change', nested);
      const open = disclosure.open, beforeWrite = changes;
      disclosure.open = false; await disclosure.updateComplete; await new Promise(r => setTimeout(r, 30));
      return { committed, unchanged, canceled, superseded, open, reason, silent: beforeWrite === changes, changes, toggles };
    }, tag);
    expect(result).toEqual({ committed: 'committed', unchanged: 'unchanged', canceled: 'canceled', superseded: 'superseded', open: true, reason: 'api', silent: true, changes: 4, toggles: tag === 'en-accordion-item' ? 0 : 2 });
  });
}

for (const mutation of ['none', 'veto', 'disable', 'remove', 'author']) {
  test(`grouped accordion emits only group proposal: ${mutation}`, async ({ page }) => {
    const result = await page.evaluate(async mutation => {
      const group: any = document.createElement('en-accordion');
      group.innerHTML = '<en-accordion-item value="a"></en-accordion-item><en-accordion-item value="b"></en-accordion-item>';
      group.value = ['a']; document.body.append(group); await group.updateComplete; await new Promise(r => setTimeout(r, 0));
      const item: any = group.children[1]; await item.updateComplete;
      let events = 0, childEvents = 0;
      item.addEventListener('en-change', () => childEvents++);
      group.addEventListener('en-change', (e: Event) => {
        events++;
        if (mutation === 'veto') e.preventDefault();
        if (mutation === 'disable') item.disabled = true;
        if (mutation === 'remove') item.remove();
        if (mutation === 'author') { group.value = ['a','b']; e.preventDefault(); }
      });
      const outcome = item.requestOpen(true); await group.updateComplete;
      return { outcome, events, childEvents, value: [...group.value] };
    }, mutation);
    expect(result).toEqual({ outcome: mutation === 'none' ? 'committed' : mutation === 'author' ? 'superseded' : 'canceled', events: 1, childEvents: 0, value: mutation === 'none' ? ['b'] : mutation === 'author' ? ['a','b'] : ['a'] });
  });
}

test('grouped nested user toggle uses tentative group state', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const group: any = document.createElement('en-accordion');
    group.innerHTML = '<en-accordion-item value="a"></en-accordion-item>';
    document.body.append(group); await group.updateComplete; await new Promise(r => setTimeout(r, 0));
    const item: any = group.firstElementChild; await item.updateComplete;
    let changes = 0;
    group.addEventListener('en-change', () => {
      changes++;
      if (changes === 1) item.shadowRoot.querySelector('button').click();
    });
    const outcome = item.requestOpen(true);
    return { outcome, changes, value: [...group.value] };
  });
  expect(result).toEqual({ outcome: 'superseded', changes: 2, value: [] });
});

for (const mode of ['commit', 'veto', 'author']) {
  test(`token composition settlement preserves ${mode}`, async ({ page }) => {
    const result = await page.evaluate(async mode => {
      const editor: any = document.createElement('en-token-editor'); editor.value = 'A';
      document.body.append(editor); await editor.updateComplete; editor.focus();
      const input = editor.shadowRoot.querySelector('[contenteditable]');
      editor.addEventListener('en-change', (e: Event) => { if (mode === 'veto') e.preventDefault(); });
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.textContent = 'AB';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText' }));
      if (mode === 'author') editor.value = 'Reset';
      const during = editor.value;
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      return { during, value: editor.value, draft: editor.draftValue, composing: editor.composing };
    }, mode);
    const value = mode === 'commit' ? 'AB' : mode === 'veto' ? 'A' : 'Reset';
    expect(result).toEqual({ during: 'A', value, draft: value, composing: false });
  });
}
