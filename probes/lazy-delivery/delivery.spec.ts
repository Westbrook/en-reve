import {test, expect} from '@playwright/test';

for (const mode of ['auto', 'global']) {
  for (const boundary of ['ordinary', 'shadow']) test(`${mode}/${boundary}: preparation preserves native editing and dormant sibling calendars`, async ({page}) => {
    await page.goto(`/index.html?${mode === 'global' ? 'global&' : ''}${boundary === 'shadow' ? 'shadow' : ''}`);
    await page.waitForFunction(() => !!(window as any).deliveryFixture);
    const initial = await page.evaluate(() => (window as any).deliveryFixture.setupDates());
    expect(initial.fields.every((field: any) => field.input && field.calendarCount === 0 && field.loading === 'deferred')).toBe(true);
    expect(initial.calendarDefined).toBe(false);
    await page.getByRole('textbox', {name: 'Essential draft'}).fill('Keep this edit');
    await page.getByRole('textbox', {name: 'Essential draft'}).focus();
    await page.evaluate(() => (window as any).deliveryFixture.prepareDates());
    const prepared = await page.evaluate(() => (window as any).deliveryFixture.dateState());
    expect(prepared).toEqual(initial);
    await expect(page.getByRole('textbox', {name: 'Essential draft'})).toBeFocused();
    await page.evaluate(() => (window as any).deliveryFixture.openDate(0));
    const opened = await page.evaluate(() => (window as any).deliveryFixture.dateState());
    expect(opened.calendarDefined).toBe(true);
    expect(opened.fields.map((field: any) => field.calendarCount)).toEqual([1, 0]);
    expect(opened.fields.map((field: any) => field.open)).toEqual([true, false]);
    await page.evaluate(() => (window as any).deliveryFixture.closeDate(0));
    await expect(page.getByRole('textbox', {name: 'Essential draft'})).toHaveValue('Keep this edit');
  });

  for (const order of ['eager-first', 'shell-first']) test(`${mode}: ${order} keeps constructor identity across registries`, async ({page}) => {
    await page.goto(`/index.html?${mode === 'global' ? 'global' : ''}`);
    await page.waitForFunction(() => !!(window as any).deliveryFixture);
    const result = await page.evaluate(order => (window as any).deliveryFixture.mixed(order), order);
    expect(result.sameConstructor).toBe(true);
    expect(result.calendarBefore).toBe(order === 'eager-first');
    expect(result.calendarAfter).toBe(true);
    expect(result.secondCalendar).toBe(true);
    expect(result.separateRegistry).toBe(result.actual === 'scoped');
  });

  test(`${mode}: shared command preparation is independent of cancellation and disposal`, async ({page}) => {
    await page.goto(`/index.html?${mode === 'global' ? 'global' : ''}`);
    await page.waitForFunction(() => !!(window as any).deliveryFixture);
    await page.evaluate(() => {
      const f = (window as any).deliveryFixture; f.hold(); for (let i = 0; i < 3; i++) f.addCommand();
      (window as any).pendingDelivery = [f.prepareCommands(), f.activate(0), f.activate(1), f.activate(2)];
      f.cancel(0); f.dispose(1); f.release();
    });
    const result = await page.evaluate(async () => ({outcomes: await Promise.all((window as any).pendingDelivery), state: (window as any).deliveryFixture.commandState()}));
    expect(result.outcomes.map((outcome: any) => outcome.ok)).toEqual([true, false, false, true]);
    expect(result.outcomes.slice(1, 3).every((outcome: any) => outcome.name === 'AbortError')).toBe(true);
    expect(result.state.imports).toBe(1);
    expect(result.state.readiness).toBe(1);
    expect(result.state.entries.map((entry: any) => entry.state)).toEqual(['dormant', 'disposed', 'ready']);
    expect(result.state.entries.map((entry: any) => entry.upgraded)).toEqual([false, false, true]);
    expect(result.state.entries.every((entry: any) => !entry.open)).toBe(true);
    expect(await page.evaluate(() => (window as any).deliveryFixture.activate(0))).toEqual({ok: true});
    expect((await page.evaluate(() => (window as any).deliveryFixture.commandState())).imports).toBe(1);
  });

  test(`${mode}: preparation failure requires explicit retry; readiness cancellation preserves the owned node`, async ({page}) => {
    await page.goto(`/index.html?${mode === 'global' ? 'global' : ''}`);
    await page.waitForFunction(() => !!(window as any).deliveryFixture);
    await page.evaluate(() => {const f = (window as any).deliveryFixture; f.addCommand(); f.fail(true);});
    expect((await page.evaluate(() => (window as any).deliveryFixture.prepareCommands())).stage).toBe('load');
    await page.evaluate(() => (window as any).deliveryFixture.fail(false));
    expect((await page.evaluate(() => (window as any).deliveryFixture.prepareCommands())).stage).toBe('load');
    expect(await page.evaluate(() => (window as any).deliveryFixture.prepareCommands(true))).toEqual({ok: true});
    const prepared = await page.evaluate(() => (window as any).deliveryFixture.commandState());
    expect(prepared.defined).toBe(false);
    expect(prepared.entries[0].upgraded).toBe(false);
    expect(prepared.imports).toBe(2);
    await page.evaluate(() => {const f = (window as any).deliveryFixture; f.holdReadiness(); (window as any).pendingReady = f.activate(0);});
    await page.waitForFunction(() => (window as any).deliveryFixture.commandState().readiness === 1);
    const result = await page.evaluate(async () => {
      const f = (window as any).deliveryFixture, node = f.entries[0].root.firstElementChild;
      f.cancel(0); const canceled = await (window as any).pendingReady; f.releaseReadiness(); const retried = await f.activate(0);
      return {canceled, retried, sameNode: node === f.entries[0].root.firstElementChild, state: f.commandState()};
    });
    expect(result.canceled.name).toBe('AbortError');
    expect(result.retried).toEqual({ok: true});
    expect(result.sameNode).toBe(true);
    expect(result.state.entries[0].state).toBe('ready');
    expect(result.state.imports).toBe(2);
  });
}

// The packed producer uses chunkNames: 'chunks/[name]-[hash]'; this intercepts
// the real optional Calendar entry rather than replacing a component loader.
const heldForeignCalendarError = "Deferred calendar construction is unsupported for a source-realm picker in another document's global registry. Keep its native scoped registry or create a new picker from destination-realm modules.";

async function setupHeldDateOwnership(page: import('@playwright/test').Page, location: 'source-global' | 'foreign-global') {
  await page.goto('/index.html?global');
  await page.waitForFunction(() => !!(window as any).deliveryFixture);
  await page.evaluate(() => (window as any).deliveryFixture.setupDates());
  return page.evaluate(async location => {
    const fixture = (window as any).deliveryFixture, picker = fixture.fields[0];
    const sourceRegistry = customElements;
    picker.id = 'held-date-picker'; picker.name = 'eventDate'; picker.defaultValue = '2026-09-18';
    picker.value = '2026-09-28'; picker.today = '2026-09-28';
    picker.loadingLabel = 'Waiting for optional calendar';
    picker.loadErrorLabel = 'Optional calendar unavailable';
    picker.loadRetryErrorLabel = 'Optional calendar retry {attempt} unavailable';
    const form = document.createElement('form'), fieldset = document.createElement('fieldset');
    fieldset.append(picker); form.append(fieldset); document.body.append(form);
    await picker.updateComplete;
    const root = picker.shadowRoot, input = root.querySelector('input[type="date"]') as HTMLInputElement;
    const trigger = root.querySelector('#picker-trigger'), dialog = root.querySelector('en-dialog');
    await Promise.all([trigger.updateComplete, dialog.updateComplete]);
    const triggerControl = trigger.shadowRoot.querySelector('button') as HTMLButtonElement;
    let changes = 0, drafts = 0;
    picker.addEventListener('en-change', (event: Event) => {changes++; event.preventDefault();});
    picker.addEventListener('en-input', () => drafts++);
    input.focus(); input.value = '2026-10-02';
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
    await picker.updateComplete;
    let frame: HTMLIFrameElement | undefined;
    let owner = document;
    if (location === 'foreign-global') {
      frame = document.createElement('iframe'); frame.id = 'held-date-destination';
      const loaded = new Promise<void>(resolve => frame!.addEventListener('load', () => resolve(), {once: true}));
      frame.src = 'about:blank'; document.body.append(frame); await loaded;
      owner = frame.contentDocument!;
      // Copy only the already registered shell closure, before moving the live
      // shell. Calendar remains absent from both real global registries.
      for (const tag of ['en-button', 'en-icon', 'en-dialog', 'en-date-picker']) {
        const constructor = sourceRegistry.get(tag);
        if (!constructor) throw new Error(`Missing packed shell definition ${tag}.`);
        frame.contentWindow!.customElements.define(tag, constructor);
      }
      owner.body.append(owner.adoptNode(form));
      picker.requestUpdate(); await picker.updateComplete;
    }
    const view = owner.defaultView as Window & typeof globalThis, registry = view.customElements;
    const sentinel = owner.createElement('button'); sentinel.type = 'button'; sentinel.textContent = 'Keep focus here'; owner.body.append(sentinel);
    input.focus();
    let optionalDefineCalls = 0;
    const define = registry.define;
    registry.define = function(this: CustomElementRegistry, tag: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
      if (tag === 'en-calendar') optionalDefineCalls++;
      return define.call(this, tag, constructor, options);
    };
    const active = () => {
      let element: Element | null = owner.activeElement;
      while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
      return element;
    };
    const snapshot = () => ({
      sameHost: fixture.fields[0] === picker,
      sameRoot: picker.shadowRoot === root, sameInput: root.querySelector('input[type="date"]') === input,
      sameTrigger: root.querySelector('#picker-trigger') === trigger && trigger.shadowRoot.querySelector('button') === triggerControl,
      sameDialog: root.querySelector('en-dialog') === dialog,
      ownerDocument: [form, fieldset, picker, root, input, trigger, dialog].every(node => node.ownerDocument === owner),
      connected: picker.isConnected, formAssociated: picker.form === form,
      accepted: picker.value, draft: input.value, submitted: new view.FormData(form).getAll('eventDate'),
      inputDisabled: input.disabled, inputReadOnly: input.readOnly, triggerDisabled: triggerControl.disabled,
      sourceCalendarDefined: !!sourceRegistry.get('en-calendar'), ownerCalendarDefined: !!registry.get('en-calendar'),
      optionalDefineCalls, calendarCount: root.querySelectorAll('en-calendar').length, dialogOpen: dialog.open,
      status: root.querySelector('[part~="calendar-status"]').textContent.trim(),
      focus: active() === input ? 'input' : active() === sentinel ? 'sentinel'
        : active()?.matches('button[data-date]') ? 'date' : 'other',
      changes, drafts,
    });
    (window as any).heldDateOwnership = {picker, root, input, trigger, triggerControl, dialog, form, fieldset, owner, registry, sentinel, snapshot, settled: false};
    return snapshot();
  }, location);
}

function heldDateStable() {
  return {
    sameHost: true, sameRoot: true, sameInput: true, sameTrigger: true, sameDialog: true,
    ownerDocument: true, connected: true, formAssociated: true,
    accepted: '2026-09-28', draft: '2026-10-02', submitted: ['2026-09-28'],
    inputDisabled: false, inputReadOnly: false, triggerDisabled: false,
    sourceCalendarDefined: false, ownerCalendarDefined: false, optionalDefineCalls: 0,
    calendarCount: 0, dialogOpen: false, status: '', focus: 'input', changes: 1, drafts: 1,
  };
}

for (const location of ['source-global', 'foreign-global'] as const) {
  for (const action of ['disabled', 'fieldset', 'readOnly', 'disconnect'] as const) {
    test(`${location}: ${action} cancellation survives restoration before held calendar load completes`, async ({page}) => {
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      const requests: string[] = [];
      let continuedRequests = 0;
      let release!: () => void;
      const gate = new Promise<void>(resolve => {release = resolve;});
      await page.route('**/chunks/calendar-*.js', async route => {
        requests.push(new URL(route.request().url()).pathname);
        await gate; continuedRequests++; await route.continue();
      });
      try {
        const stable = heldDateStable();
        expect(await setupHeldDateOwnership(page, location)).toEqual(stable);
        expect(requests).toEqual([]);
        const samePromise = await page.evaluate(() => {
          const f = (window as any).heldDateOwnership;
          // Keep the opening's original focus through cancellation/restoration:
          // a later focus mismatch must not mask a stale opening continuation.
          f.sentinel.focus();
          const first = f.picker.showPicker(), second = f.picker.showPicker();
          f.pending = Promise.allSettled([first, second]).then(outcomes => {
            f.settled = true;
            return outcomes.map(outcome => outcome.status === 'fulfilled'
              ? {status: 'fulfilled'} : {status: 'rejected', name: outcome.reason?.name, message: outcome.reason?.message});
          });
          return first === second;
        });
        expect(samePromise).toBe(true);
        await expect.poll(() => requests.length).toBe(1);
        expect(await page.evaluate(() => (window as any).heldDateOwnership.settled)).toBe(false);
        await expect.poll(() => page.evaluate(() => (window as any).heldDateOwnership.snapshot())).toEqual({...stable, focus: 'sentinel', status: 'Waiting for optional calendar'});

        await page.evaluate(async action => {
          const f = (window as any).heldDateOwnership;
          if (action === 'disabled') f.picker.disabled = true;
          else if (action === 'fieldset') f.fieldset.disabled = true;
          else if (action === 'readOnly') f.picker.readOnly = true;
          else f.picker.remove();
          // disabled/readOnly cancellation is observed through the actual update,
          // including inherited fieldset disabled state, before release/re-enable.
          await f.picker.updateComplete; await f.trigger.updateComplete;
          f.sentinel.focus();
        }, action);
        await expect.poll(() => page.evaluate(() => (window as any).heldDateOwnership.settled)).toBe(true);
        expect(await page.evaluate(() => (window as any).heldDateOwnership.pending)).toEqual([{status: 'fulfilled'}, {status: 'fulfilled'}]);
        const disabled = action === 'disabled' || action === 'fieldset';
        const canceled = {...stable, focus: 'sentinel',
          connected: action !== 'disconnect', formAssociated: action !== 'disconnect',
          submitted: disabled || action === 'disconnect' ? [] : ['2026-09-28'],
          inputDisabled: disabled, inputReadOnly: action === 'readOnly', triggerDisabled: disabled || action === 'readOnly'};
        await expect.poll(() => page.evaluate(() => (window as any).heldDateOwnership.snapshot())).toEqual(canceled);

        // Become valid again while the original response is still held. The
        // canceled opening must not revive when that shared load later settles.
        await page.evaluate(async action => {
          const f = (window as any).heldDateOwnership;
          if (action === 'disabled') f.picker.disabled = false;
          else if (action === 'fieldset') f.fieldset.disabled = false;
          else if (action === 'readOnly') f.picker.readOnly = false;
          else f.fieldset.append(f.picker);
          f.picker.requestUpdate(); await f.picker.updateComplete; await f.trigger.updateComplete;
        }, action);
        const restored = {...stable, focus: 'sentinel'};
        await expect.poll(() => page.evaluate(() => (window as any).heldDateOwnership.snapshot())).toEqual(restored);
        expect(requests).toHaveLength(1);
        expect(continuedRequests).toBe(0);

        release();
        // Public preparation drains the same real optional import without
        // registration or opening after the canceled shell is valid again.
        await page.evaluate(async () => {
          const f = (window as any).heldDateOwnership;
          await f.picker.preparePicker(); await f.pending; await f.picker.updateComplete;
        });
        expect(requests).toHaveLength(1);
        expect(continuedRequests).toBe(1);
        expect(await page.evaluate(() => (window as any).heldDateOwnership.snapshot())).toEqual(restored);

        const next = await page.evaluate(async () => {
          const f = (window as any).heldDateOwnership;
          f.input.focus();
          const outcomes = await Promise.allSettled([f.picker.showPicker()]); await f.picker.updateComplete;
          const outcome = outcomes[0];
          const calendar = f.root.querySelector('en-calendar'), Constructor = f.registry.get('en-calendar');
          return {outcome: outcome.status === 'fulfilled' ? {status: 'fulfilled'}
            : {status: 'rejected', name: outcome.reason?.name, message: outcome.reason?.message},
            calendarReady: !!calendar && !!Constructor && calendar.constructor === Constructor && calendar.matches(':defined')
              && calendar.ownerDocument === f.owner && !!calendar.shadowRoot,
            state: f.snapshot()};
        });
        expect(next).toEqual(location === 'foreign-global' ? {
          outcome: {status: 'rejected', name: 'Error', message: heldForeignCalendarError}, calendarReady: false,
          state: {...stable, status: 'Optional calendar unavailable'},
        } : {
          outcome: {status: 'fulfilled'}, calendarReady: true,
          state: {...stable, sourceCalendarDefined: true, ownerCalendarDefined: true, optionalDefineCalls: 1, calendarCount: 1, dialogOpen: true, focus: 'date'},
        });
        expect(requests).toHaveLength(1);
        expect(errors).toEqual([]);
      } finally {
        release();
      }
    });
  }
}
