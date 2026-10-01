import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
    await page.goto('/probes/api-transactions/fixture.html');
    await page.waitForFunction(() => (window as any).ready);
});
for (const mutation of ['disable', 'remove', 'rename', 'group-disable', 'author', 'veto'])
    test(`radio selection: ${mutation}`, async ({ page }) => {
        const result = await page.evaluate(async (mutation) => {
            document.body.insertAdjacentHTML('beforeend', '<en-radio-group value="a"><en-radio value="a">A</en-radio><en-radio value="b">B</en-radio></en-radio-group>');
            const group: any = document.querySelector('en-radio-group');
            await group.updateComplete;
            await new Promise(r => setTimeout(r, 0));
            const radio: any = group.children[1];
            await radio.updateComplete;
            group.addEventListener('en-change', (e: any) => {
                if (mutation === 'disable') {
                    radio.disabled = true;
                }
                if (mutation === 'remove') {
                    radio.remove();
                }
                if (mutation === 'rename') {
                    radio.value = 'c';
                }
                if (mutation === 'group-disable') {
                    group.disabled = true;
                }
                if (mutation === 'author') {
                    radio.disabled = true;
                    group.value = 'c';
                    e.preventDefault();
                }
                if (mutation === 'veto') {
                    e.preventDefault();
                }
            });
            radio.shadowRoot.querySelector('input').click();
            return group.value;
        }, mutation);
        expect(result).toBe(mutation === 'author' ? 'c' : 'a');
    });
for (const veto of [false, true])
    test(`rich accepted nested change survives outer veto=${veto}`, async ({ page }) => {
        const result = await page.evaluate(async (veto) => {
            const e: any = document.createElement('en-rich-text-editor');
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            e.value = 'A';
            e.focus();
            let nested = false;
            e.addEventListener('en-change', (event: any) => {
                if (nested) {
                    return;
                }
                nested = true;
                e.replaceBookmark(e.captureBookmark(), [{ kind: 'text', text: 'C' }]);
                if (veto) {
                    event.preventDefault();
                }
            });
            e.replaceBookmark(e.captureBookmark(), [{ kind: 'text', text: 'B' }]);
            return e.value;
        }, veto);
        expect(result).toContain('B');
        expect(result).toContain('C');
    });
for (const tag of ['en-token-editor', 'en-rich-text-editor']) {
    test(`${tag} aborted handoff and invalidated action`, async ({ page }) => {
        const result = await page.evaluate(async (tag) => {
            const e: any = document.createElement(tag);
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            let session: any;
            let dispose = e.registerExtension({ id: 'x', trigger: '@', label: 'X', open: (s: any) => session = s });
            e.openExtension('x');
            let threw = false;
            try {
                session.openPicker(() => {
                    throw new Error('callback');
                });
            }
            catch {
                threw = true;
            }
            const aborted = session.signal.aborted;
            dispose();
            dispose = e.registerExtension({ id: 'x', trigger: '@', label: 'X', open: (s: any) => session = s });
            e.openExtension('x');
            e.addEventListener('en-action', () => dispose(), { once: true });
            const accepted = session.commit({ id: 'c', label: 'C', action: 'choose', insert: [{ kind: 'text', text: 'C' }] });
            return { threw, aborted, accepted, value: e.value };
        }, tag);
        expect(result).toEqual({ threw: true, aborted: true, accepted: false, value: '' });
    });
}
for (const tag of ['en-popover', 'en-menu', 'en-dialog'])
    test(`${tag} honors click cancellation and consumes submit`, async ({ page }) => {
        const result = await page.evaluate(async (tag) => {
            const form = document.createElement('form');
            form.innerHTML = `<button id="opener">Open</button><${tag} for="opener"></${tag}>`;
            let submits = 0;
            form.addEventListener('submit', e => {
                e.preventDefault();
                submits++;
            });
            const button = form.querySelector('button')!;
            button.addEventListener('click', e => e.preventDefault(), { once: true });
            document.body.append(form);
            const surface: any = form.lastElementChild;
            await surface.updateComplete;
            await new Promise(r => setTimeout(r, 0));
            button.click();
            const canceled = surface.open;
            button.click();
            await surface.updateComplete;
            return { canceled, open: surface.open, submits };
        }, tag);
        expect(result).toEqual({ canceled: false, open: true, submits: 0 });
    });
for (const mutation of ['disable', 'remove', 'rename', 'rebind'])
    test(`popover revalidates ${mutation}`, async ({ page }) => {
        const result = await page.evaluate(async (mutation) => {
            document.body.insertAdjacentHTML('beforeend', '<button id="opener">Open</button><en-popover for="opener"></en-popover>');
            const button: any = document.querySelector('button');
            const pop: any = document.querySelector('en-popover');
            await pop.updateComplete;
            await new Promise(r => setTimeout(r, 0));
            pop.addEventListener('en-change', () => {
                if (mutation === 'disable') {
                    button.disabled = true;
                }
                if (mutation === 'remove') {
                    button.remove();
                }
                if (mutation === 'rename') {
                    button.id = 'other';
                }
                if (mutation === 'rebind') {
                    pop.for = 'other';
                }
            });
            button.click();
            return pop.open;
        }, mutation);
        expect(result).toBe(false);
    });
test('tabs reject stale selection, reconcile IDs, skip hidden and inert', async ({ page }) => {
    const result = await page.evaluate(async () => {
        document.body.insertAdjacentHTML('beforeend', '<en-tabs value="a"><en-tab slot="tab" value="a" id="a">A</en-tab><en-tab slot="tab" value="b" hidden>B</en-tab><en-tab slot="tab" value="c" inert>C</en-tab><en-tab slot="tab" value="d">D</en-tab><en-tab-panel slot="panel" value="a" id="pa">A</en-tab-panel></en-tabs>');
        const tabs: any = document.querySelector('en-tabs');
        await tabs.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        const a: any = tabs.children[0], d: any = tabs.children[3], panel: any = tabs.children[4];
        a.focus();
        a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        const skipped = tabs.value;
        tabs.value = 'a';
        tabs.addEventListener('en-change', () => d.disabled = true, { once: true });
        d.click();
        const rejected = tabs.value;
        a.id = 'new-a';
        panel.id = 'new-panel';
        await new Promise(r => setTimeout(r, 20));
        return { skipped, rejected, controls: a.getAttribute('aria-controls'), labelledby: panel.getAttribute('aria-labelledby') };
    });
    expect(result).toEqual({ skipped: 'd', rejected: 'a', controls: 'new-panel', labelledby: 'new-a' });
});
test('accordion revalidates proposals and reconciles child keys', async ({ page }) => {
    const result = await page.evaluate(async () => {
        document.body.insertAdjacentHTML('beforeend', '<en-accordion><en-accordion-item value="a" label="A"></en-accordion-item><en-accordion-item value="b" label="B"></en-accordion-item></en-accordion><en-accordion-item id="standalone" label="S"></en-accordion-item>');
        const group: any = document.querySelector('en-accordion');
        await group.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        const item: any = group.children[0];
        await item.updateComplete;
        group.addEventListener('en-change', () => item.disabled = true, { once: true });
        item.shadowRoot.querySelector('button').click();
        const rejected = [...group.value];
        item.disabled = false;
        group.value = ['a'];
        await group.updateComplete;
        item.value = 'c';
        await item.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        const reconciled = item.open;
        const standalone: any = document.querySelector('#standalone');
        await standalone.updateComplete;
        standalone.addEventListener('en-change', () => standalone.disabled = true);
        standalone.shadowRoot.querySelector('button').click();
        return { rejected, reconciled, standalone: standalone.open };
    });
    expect(result).toEqual({ rejected: [], reconciled: false, standalone: false });
});
for (const typed of [false, true])
    test(`invalid plane author write interrupts gesture: typed=${typed}`, async ({ page }) => {
        await page.evaluate(async () => {
            const e: any = document.createElement('en-color-plane');
            e.value = '#ff0000';
            document.body.append(e);
            await e.updateComplete;
            (window as any).changes = 0;
            e.addEventListener('en-change', () => (window as any).changes++);
        });
        const plane = page.locator('en-color-plane [part="plane"]');
        const box = await plane.boundingBox();
        expect(box).not.toBeNull();
        await page.mouse.move(box!.x + box!.width * .4, box!.y + box!.height * .4);
        await page.mouse.down();
        await page.evaluate(typed => {
            const e: any = document.querySelector('en-color-plane');
            if (typed) {
                e.colorValue = { space: 'bogus' };
            }
            else
                e.value = 'invalid';
        }, typed);
        await page.mouse.move(box!.x + box!.width * .8, box!.y + box!.height * .8);
        await page.mouse.up();
        expect(await page.evaluate(() => ({ value: (document.querySelector('en-color-plane') as any).value, valid: (document.querySelector('en-color-plane') as any).checkValidity(), changes: (window as any).changes }))).toEqual({ value: '#ff0000', valid: false, changes: 0 });
    });
test('dismissAll includes pending notifications and respects veto', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const region: any = document.createElement('en-toast-region');
        document.body.append(region);
        const a = region.notify({ message: 'A' }), b = region.notify({ message: 'B' });
        b.addEventListener('en-change', (e: Event) => e.preventDefault());
        region.dismissAll();
        await region.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        return { a: a.open, b: b.open, count: region.children.length };
    });
    expect(result).toEqual({ a: false, b: true, count: 2 });
});
test('removed localization attributes restore defaults', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const pairs = [['en-pagination', 'status-label', 'statusLabel'], ['en-toolbar', 'label', 'label'], ['en-navigation-group', 'label', 'label'], ['en-popover', 'close-label', 'closeLabel'], ['en-menu', 'back-label', 'backLabel'], ['en-dialog', 'close-label', 'closeLabel'], ['en-command-palette', 'search-label', 'searchLabel']];
        const out = [];
        for (const [tag, attr, prop] of pairs) {
            const e: any = document.createElement(tag), original = e[prop];
            document.body.append(e);
            await e.updateComplete;
            e.setAttribute(attr, 'Custom');
            await e.updateComplete;
            e.removeAttribute(attr);
            try {
                await e.updateComplete;
                out.push(e[prop] === original);
            }
            catch {
                out.push(false);
            }
        }
        return out;
    });
    expect(result).toEqual(Array(7).fill(true));
});
for (const outerVeto of [false, true])
    test(`rich canceled nested proposal preserves outer rollback=${outerVeto}`, async ({ page }) => {
        const result = await page.evaluate(async (outerVeto) => {
            const e: any = document.createElement('en-rich-text-editor');
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            e.value = 'A';
            e.focus();
            let depth = 0;
            e.addEventListener('en-change', (event: any) => {
                if (depth) {
                    event.preventDefault();
                    return;
                }
                depth++;
                e.replaceBookmark(e.captureBookmark(), [{ kind: 'text', text: 'C' }]);
                depth--;
                if (outerVeto) {
                    event.preventDefault();
                }
            });
            e.replaceBookmark(e.captureBookmark(), [{ kind: 'text', text: 'B' }]);
            return e.value;
        }, outerVeto);
        expect(result).toBe(outerVeto ? 'A' : 'BA');
    });
for (const mutation of ['author', 'equal-author', 'readonly'])
    test(`rich final authority: ${mutation}`, async ({ page }) => {
        const result = await page.evaluate(async (mutation) => {
            const e: any = document.createElement('en-rich-text-editor');
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            e.value = 'A';
            e.focus();
            e.addEventListener('en-change', (event: any) => {
                if (mutation === 'author') {
                    e.value = 'X';
                }
                if (mutation === 'equal-author') {
                    e.document = e.document;
                }
                if (mutation === 'readonly') {
                    e.readOnly = true;
                }
                event.preventDefault();
            });
            e.replaceBookmark(e.captureBookmark(), [{ kind: 'text', text: 'B' }]);
            return e.value;
        }, mutation);
        expect(result).toBe(mutation === 'author' ? 'X' : mutation === 'equal-author' ? 'BA' : 'A');
    });
for (const tag of ['en-token-editor', 'en-rich-text-editor']) {
    test(`${tag} occurrence cancellation restores token focus`, async ({ page }) => {
        const result = await page.evaluate(async (tag) => {
            const e: any = document.createElement(tag);
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            e.registerToken('person', () => document.createTextNode('Person'), { extension: 'person' });
            let session: any;
            e.registerExtension({ id: 'person', label: 'Person', trigger: '@', open: (s: any) => session = s });
            e.replaceBookmark(e.captureBookmark(), [{ kind: 'token', id: 'p', type: 'person', text: 'Person', label: 'Person', data: null }]);
            e.openExtension('person', { tokenId: 'p' });
            session.cancel();
            return e.shadowRoot.activeElement?.dataset.token;
        }, tag);
        expect(result).toBe('p');
    });
    test(`${tag} a throwing old callback preserves its replacement session`, async ({ page }) => {
        const result = await page.evaluate(async (tag) => {
            const e: any = document.createElement(tag);
            document.body.append(e);
            await e.updateComplete;
            while (!e.shadowRoot.querySelector('[contenteditable]')) {
                await new Promise(r => setTimeout(r, 10));
            }
            let first: any, second: any;
            e.registerExtension({ id: 'a', label: 'A', trigger: '@', open: (s: any) => first = s });
            e.registerExtension({ id: 'b', label: 'B', trigger: '#', open: (s: any) => second = s });
            e.openExtension('a');
            try {
                first.openPicker(() => {
                    e.openExtension('b');
                    throw new Error('old callback');
                });
            }
            catch {
            }
            return { old: first.signal.aborted, new: second.signal.aborted, accepted: second.commit({ id: 'b', label: 'B', insert: [{ kind: 'text', text: 'B' }] }), value: e.value };
        }, tag);
        expect(result).toEqual({ old: true, new: false, accepted: true, value: 'B' });
    });
    for (const mutation of ['disabled', 'readOnly', 'disconnect', 'cancel'])
        test(`${tag} action callback invalidates ${mutation}`, async ({ page }) => {
            const result = await page.evaluate(async ({ tag, mutation }) => {
                const e: any = document.createElement(tag);
                document.body.append(e);
                await e.updateComplete;
                while (!e.shadowRoot.querySelector('[contenteditable]')) {
                    await new Promise(r => setTimeout(r, 10));
                }
                let session: any;
                e.registerExtension({ id: 'a', label: 'A', trigger: '@', open: (s: any) => session = s });
                e.openExtension('a');
                e.addEventListener('en-action', () => {
                    if (mutation === 'disconnect') {
                        e.remove();
                    }
                    else if (mutation === 'cancel') {
                        session.cancel();
                    }
                    else
                        e[mutation] = true;
                });
                return { accepted: session.commit({ id: 'c', label: 'C', action: 'choose', insert: [{ kind: 'text', text: 'C' }] }), value: e.value };
            }, { tag, mutation });
            expect(result).toEqual({ accepted: false, value: '' });
        });
}
test('toast additions before connection and across disconnection', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const region: any = document.createElement('en-toast-region');
        const a = region.notify({ message: 'before connection' });
        region.dismissAll();
        document.body.append(region);
        await region.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        const b = region.notify({ message: 'interrupted' });
        region.remove();
        document.body.append(region);
        await region.updateComplete;
        await new Promise(r => setTimeout(r, 0));
        return { a: a.open, aAttached: a.parentNode === region, bAttached: b.parentNode === region };
    });
    expect(result).toEqual({ a: false, aAttached: true, bAttached: false });
});
test('pagination preserves empty strings and handles untyped null templates', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const e: any = document.createElement('en-pagination');
        document.body.append(e);
        await e.updateComplete;
        e.statusLabel = '';
        await e.updateComplete;
        const empty = e.statusLabel;
        e.statusLabel = null;
        await e.updateComplete;
        return empty;
    });
    expect(result).toBe('');
});
