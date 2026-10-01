import {chromium, firefox, webkit, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';

const base = process.argv[2] ?? 'artifacts/scoped-registry-phase-6-retry-closeout';
const results = [];
await exclusiveBrowserWork(async () => {
  const server = await serve('candidate/cold', 0, base);
  try {
    for (const [name, type] of Object.entries({chromium, firefox, webkit})) {
      const browser = await type.launch();
      try {
        for (const mode of ['global', 'scoped']) {
          for (const cancel of ['none', 'hide', 'reset', 'remove', 'disabled', 'readonly']) {
            console.log('Checking', name, mode, cancel);
            const page = await browser.newPage({ignoreHTTPSErrors: true});
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/calendar-*.js', route => route.fulfill({status: 503, body: 'Retry qualification'}));
            await page.goto(`${server.url}/?mode=${mode}`);
            await page.waitForFunction(() => !!window.study);
            const trigger = page.locator('#picker-trigger').getByRole('button');
            const status = page.locator('[part="calendar-status"]');
            await trigger.click();
            await expect(status).toHaveText('Calendar could not load. Try again, reload the page, or enter a date directly.');
            if (cancel !== 'none') {
              await page.evaluate(async cancel => {
                const p = study.picker, parent = p.parentNode;
                const work = p.showPicker();
                if (cancel === 'hide') p.hidePicker();
                if (cancel === 'reset') document.querySelector('form').reset();
                if (cancel === 'remove') p.remove();
                if (cancel === 'disabled') p.disabled = true;
                if (cancel === 'readonly') p.readOnly = true;
                await work;
                if (cancel === 'remove') parent.append(p);
                p.disabled = false; p.readOnly = false;
                await p.updateComplete;
              }, cancel);
            }
            await expect(trigger).toBeEnabled();
            await trigger.focus();
            await expect(trigger).toBeFocused();
            // Coalesced programmatic calls must produce one failed retry.
            assert(await page.evaluate(async () => {
              const one = study.picker.showPicker(), two = study.picker.showPicker();
              await Promise.allSettled([one, two]);
              return one === two;
            }));
            await expect(status).toHaveText('Calendar retry 1 failed. Reload the page or enter a date directly.');
            await expect(trigger).toBeFocused();
            await trigger.click();
            await expect(status).toHaveText('Calendar retry 2 failed. Reload the page or enter a date directly.');
            await page.evaluate(() => study.picker.setAttribute('load-retry-error-label', 'Échec {attempt}. Nouvelle tentative {attempt}.'));
            await expect(status).toHaveText('Échec 2. Nouvelle tentative 2.');
            await trigger.click();
            await expect(status).toHaveText('Échec 3. Nouvelle tentative 3.');
            await expect(trigger).toBeFocused();
            await page.locator('input[type="date"]').fill('2026-10-20');
            assert.equal(await page.evaluate(() => new FormData(document.querySelector('form')).get('eventDate')), '2026-10-20');
            assert.equal(await page.locator('en-calendar').count(), 0);
            assert.deepEqual(errors, []);
            results.push({browser: name, version: browser.version(), mode, cancel, status: 'pass'});
            await page.close();
          }
        }
      } finally { await browser.close(); }
    }
  } finally { await server.close(); }
});
await mkdir(base, {recursive: true});
await writeFile(`${base}/retry-integration-verification.json`, JSON.stringify({at: new Date().toISOString(),
  limitation: 'DOM/state qualification; integrated Safari VoiceOver retest remains manual.', results}, null, 2));
console.log(`${results.length} full retry integration scenarios passed.`);
