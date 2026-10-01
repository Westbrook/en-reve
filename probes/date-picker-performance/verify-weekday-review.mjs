import {chromium, firefox, webkit, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';

const base = 'artifacts/scoped-registry-phase-6-weekday-review';
const results = [];
await exclusiveBrowserWork(async () => {
  for (const experiment of [false, true]) {
    const server = await serve('candidate/dom', 0, experiment ? base : 'artifacts/scoped-registry-phase-6-lifecycle-closeout');
    try {
      for (const [name, type] of Object.entries({chromium, firefox, webkit})) {
        const browser = await type.launch();
        try {
          for (const mode of ['global', 'scoped']) {
            for (const locale of ['en', 'fr']) {
              const page = await browser.newPage({ignoreHTTPSErrors: true});
              await page.goto(`${server.url}/?mode=${mode}`);
              await page.waitForFunction(() => !!window.study);
              await page.evaluate(async locale => {study.picker.locale = locale; await study.picker.updateComplete;}, locale);
              await page.locator('#picker-trigger').getByRole('button').click();
              const calendar = page.locator('en-calendar');
              const active = date => calendar.locator(`button[data-date="${date}"]`);
              const label = date => page.evaluate(({date, locale, experiment}) => new Intl.DateTimeFormat(locale, {
                timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric', ...(experiment ? {} : {weekday: 'long'}),
              }).format(new Date(`${date}T12:00:00Z`)), {date, locale, experiment});
              const assertDate = async date => {
                await expect(active(date)).toBeFocused();
                await expect(active(date)).toHaveAccessibleName(await label(date));
              };
              await assertDate('2026-09-15');
              await expect(active('2026-09-15').locator('..')).toHaveAttribute('aria-selected', 'true');
              assert.equal(await calendar.getByRole('columnheader').count(), 7);
              const headers = await calendar.getByRole('columnheader').all();
              if (experiment) for (const header of headers) {
                await expect(header).toHaveAccessibleName(await header.getAttribute('abbr'));
                await expect(header).toBeVisible();
              }
              const snapshot = await calendar.ariaSnapshot();
              await page.keyboard.press('ArrowRight'); await assertDate('2026-09-16');
              await page.keyboard.press('ArrowDown'); await assertDate('2026-09-23');
              await page.keyboard.press('ArrowUp'); await assertDate('2026-09-16');
              await page.keyboard.press('ArrowLeft'); await assertDate('2026-09-15');
              await page.keyboard.press('End'); await assertDate('2026-09-19');
              await page.keyboard.press('PageDown'); await assertDate('2026-10-19');
              await expect(calendar.locator('#month')).toHaveText(await page.evaluate(locale => new Intl.DateTimeFormat(locale, {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date('2026-10-19T12:00:00Z')), locale));
              await page.keyboard.press('Enter');
              await expect(page.locator('#picker-trigger').getByRole('button')).toBeFocused();
              assert.equal(await page.evaluate(() => new FormData(document.querySelector('form')).get('eventDate')), '2026-10-19');
              await page.evaluate(async () => {study.picker.value='2026-01-01';await study.picker.updateComplete;});
              await page.locator('#picker-trigger').getByRole('button').click();
              await assertDate('2026-01-01');
              await page.keyboard.press('ArrowLeft'); await assertDate('2025-12-31');
              await expect(active('2025-12-31')).toHaveAttribute('aria-disabled','true');
              await page.keyboard.press('Enter');
              assert.equal(await page.evaluate(() => study.picker.value), '2026-01-01');
              results.push({browser:name,version:browser.version(),mode,locale,experiment,status:'pass',snapshot});
              await page.close();
            }
          }
        } finally {await browser.close();}
      }
    } finally {await server.close();}
  }
});
await writeFile(`${base}/verification.json`, JSON.stringify({at:new Date().toISOString(),
  limitation:'DOM accessible-name and behavior checks; not evidence of VoiceOver announcements or perceived context.',results},null,2));
console.log(`${results.length} baseline/experimental label and keyboard checks passed.`);
