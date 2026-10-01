import {chromium, firefox, webkit, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';

const results = [];
const mode = process.argv.includes('--distinct') ? 'distinct' : 'settled';
const origin = process.env.PHASE6_REVIEW_URL ?? 'http://127.0.0.1:4235';
await exclusiveBrowserWork(async () => {
  for (const [name, type] of Object.entries({chromium, firefox, webkit})) {
    const browser = await type.launch();
    try {
      for (const experimental of [false, true]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        // Deterministic repeated failure qualifies the announcement DOM sequence
        // even when a browser would recover from the one-shot HTTP 503 fixture.
        await page.route('**/calendar-*.js', route => route.fulfill({status: 503, body: 'Retry diagnostic failure'}));
        await page.goto(`${origin}/?fail&progress-report${experimental ? `&retry-review=${mode}` : ''}`);
        await page.waitForFunction(experimental ? () => !!window.retryReview : () => !!window.study);
        await page.evaluate(() => {
          window.statusTrace = [];
          const status = study.picker.shadowRoot.querySelector('[part="calendar-status"]');
          new MutationObserver(() => statusTrace.push({at: performance.now(), text: status.textContent}))
            .observe(status, {subtree: true, childList: true, characterData: true});
        });
        const trigger = page.locator('#picker-trigger').getByRole('button');
        const status = page.locator('[part="calendar-status"]');
        await trigger.click();
        await expect(status).toContainText('could not load');
        await page.evaluate(() => { window.statusTrace = []; });
        await trigger.click();
        if (experimental && mode === 'distinct') {
          await expect(status).toContainText('Calendar retry 1 failed');
          await trigger.click();
          await expect(status).toContainText('Calendar retry 2 failed');
        } else if (experimental) {
          await page.waitForFunction(() => retryReview.events.some(row => row.event === 'restore-retry-error'));
          const sequence = await page.evaluate(() => retryReview.events);
          const clear = sequence.find(row => row.event === 'clear-retry-error');
          const restored = sequence.find(row => row.event === 'restore-retry-error');
          assert(clear && restored && restored.at > clear.at);
        }
        await expect(status).toContainText(experimental && mode === 'distinct' ? 'Calendar retry 2 failed' : 'could not load');
        await expect(trigger).toBeFocused();
        assert.equal(await page.locator('en-calendar').count(), 0);
        assert.equal(await page.evaluate(() => new FormData(document.querySelector('form')).get('eventDate')), '2026-09-15');
        assert.deepEqual(errors, []);
        results.push({browser: name, version: browser.version(), experimental, status: 'pass',
          trace: await page.evaluate(() => statusTrace),
          experiment: experimental ? await page.evaluate(() => retryReview.events) : null});
        await page.close();
      }
    } finally { await browser.close(); }
  }
});
const output = 'artifacts/scoped-registry-phase-6/retry-announcement-review';
await mkdir(output, {recursive: true});
await writeFile(`${output}/${mode === 'distinct' ? 'distinct-verification' : 'verification'}.json`, JSON.stringify({at: new Date().toISOString(), mode,
  limitation: 'DOM sequence, focus, form value and failure containment only; does not verify VoiceOver speech.', results}, null, 2));
console.log(JSON.stringify(results.map(({browser, experimental, status, trace}) => ({browser, experimental, status, trace})), null, 2));
