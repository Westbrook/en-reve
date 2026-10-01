import {chromium, firefox, webkit, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';

const base = process.argv[2] ?? 'artifacts/scoped-registry-phase-6-lifecycle-closeout';
const results = [];
await exclusiveBrowserWork(async () => {
  for (const policy of ['eager', 'dom', 'cold']) {
    const server = await serve(`candidate/${policy}`, 0, base);
    try {
      for (const [name, type] of Object.entries({chromium, firefox, webkit})) {
        const browser = await type.launch();
        try {
          for (const mode of ['global', 'scoped']) {
            for (const selection of policy === 'eager' ? ['single', 'range'] : ['single']) {
              for (const kind of ['self', 'fieldset', 'readonly']) {
                const page = await browser.newPage({ignoreHTTPSErrors: true});
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${server.url}/?mode=${mode}`);
                await page.waitForFunction(() => !!window.study);
                await page.evaluate(async ({selection, kind}) => {
                  const p = study.picker;
                  if (selection === 'range') {
                    p.selection = 'range'; p.startName = 'start'; p.endName = 'end';
                    p.rangeValue = {start: '2026-09-15', end: '2026-09-20'};
                  }
                  if (kind === 'fieldset') {
                    const fieldset = document.createElement('fieldset');
                    p.before(fieldset); fieldset.append(p);
                  }
                  await p.updateComplete;
                }, {selection, kind});
                const trigger = page.locator('#picker-trigger').getByRole('button');
                const values = () => page.evaluate(() => [...new FormData(document.querySelector('form'))]);
                const initial = await values();
                for (let cycle = 0; cycle < 3; cycle++) {
                  await page.evaluate(kind => {
                    const p = study.picker;
                    if (kind === 'self') p.disabled = true;
                    if (kind === 'fieldset') p.parentElement.disabled = true;
                    if (kind === 'readonly') p.readOnly = true;
                  }, kind);
                  await expect(trigger).toBeDisabled();
                  if (kind !== 'readonly') assert.deepEqual(await values(), []);
                  await page.evaluate(kind => {
                    const p = study.picker;
                    if (kind === 'self') p.disabled = false;
                    if (kind === 'fieldset') p.parentElement.disabled = false;
                    if (kind === 'readonly') p.readOnly = false;
                  }, kind);
                  await expect(trigger).toBeEnabled();
                  assert.deepEqual(await values(), initial);
                  await trigger.focus();
                  await page.keyboard.press('Enter');
                  await page.waitForFunction(() => study.picker.shadowRoot.querySelector('en-dialog').open);
                  await page.evaluate(() => study.picker.hidePicker());
                  await expect(trigger).toBeFocused();
                }
                assert.deepEqual(errors, []);
                results.push({browser: name, version: browser.version(), policy, mode, selection, kind, cycles: 3, status: 'pass'});
                await page.close();
              }
            }
          }
        } finally { await browser.close(); }
      }
    } finally { await server.close(); }
  }
});
await writeFile(`${base}/reenable-verification.json`, JSON.stringify({at: new Date().toISOString(), results}, null, 2));
console.log(`${results.length} re-enable scenarios passed (three cycles each).`);
