import { writeExperimentReceipt } from './receipt-output.mjs';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, json, sha } from '../src/config.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';

// Synthetic control: a public host open flag must not complete the action while
// its native dialog is closed. No application code or timing cohort is changed.
await exclusiveBrowserWork(async () => {
  const bundle = await build({ entryPoints: [resolve(root, 'src/collector.js')], bundle: true, format: 'iife', platform: 'browser', write: false });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const tag of ['wa-dialog', 'wa-drawer']) {
      const page = await browser.newPage();
      await page.addInitScript({ content: bundle.outputFiles[0].text });
      await page.route('http://127.0.0.1:4518/__collector-control', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Native dialog gate control</title>' }));
      await page.goto('http://127.0.0.1:4518/__collector-control');
      await page.evaluate(tag => {
        customElements.define(tag, class extends HTMLElement {
          constructor() { super(); this.open = false; this.attachShadow({ mode: 'open' }).innerHTML = '<dialog><h2>Calibration dialog</h2></dialog>'; }
        });
        const host = document.createElement(tag);
        host.setAttribute('label', 'Calibration dialog');
        document.body.append(host);
        const button = document.createElement('button');
        button.textContent = 'Set public open flag';
        button.onclick = () => { host.open = true; };
        document.body.append(button);
        window.__perf.arm('native-dialog-gate', { dialogName: 'Calibration dialog' });
      }, tag);
      await page.getByRole('button', { name: 'Set public open flag' }).click();
      const before = await page.evaluate(tag => {
        const host = document.querySelector(tag);
        return { hostOpen: host.open, nativeOpen: host.shadowRoot.querySelector('dialog').open, action: window.__perf.state.actions.at(-1) };
      }, tag);
      if (!before.hostOpen || before.nativeOpen || before.action.semanticReady !== undefined || before.action.completed)
        throw Error('Host flag incorrectly completed the native dialog action: ' + tag);
      const nativeOpenedAt = await page.evaluate(tag => {
        document.querySelector(tag).shadowRoot.querySelector('dialog').showModal();
        return performance.now();
      }, tag);
      await page.waitForFunction(() => window.__perf.state.actions.at(-1).completed);
      const after = await page.evaluate(() => window.__perf.state.actions.at(-1));
      if (after.semanticReady < nativeOpenedAt) throw Error('Semantic completion predates native modal opening');
      results.push({ tag, status: 'passed', before, nativeOpenedAt, after });
      await page.close();
    }
    const output = 'reports/web-awesome/dialog-calibration.json';
    await mkdir(resolve(root, 'reports/web-awesome'), { recursive: true });
    await writeExperimentReceipt(output, json({ at: new Date().toISOString(), browser: browser.version(), scope: 'Synthetic collector correctness control; no timing comparison', collectorSha256: sha(await readFile(resolve(root, 'src/collector.js'))), scriptSha256: sha(await readFile(new URL(import.meta.url))), results }), { flag: 'wx' });
    console.log('Both native dialog gate controls passed');
  } finally { await browser.close(); }
});
