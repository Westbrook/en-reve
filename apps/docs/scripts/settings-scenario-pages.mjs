import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { settingsScenarios } from '../src/workflows/settings/scenarios.ts';

/** Scenario URLs are documents, not query-selected client-only renderings. */
export const settingsScenarioPages = settingsScenarios.filter(scenario => scenario.id !== 'explore');

export async function prepareSettingsScenarios(docsRoot) {
  const shell = await readFile(resolve(docsRoot, 'workflows/settings.html'), 'utf8');
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  for (const scenario of settingsScenarioPages) {
    const html = shell
      .replace('<en-workflows-app>', `<en-workflows-app data-settings-scenario="${scenario.id}">`)
      .replace('<title>en-reve · Design settings workflow</title>', `<title>en-reve · ${escape(scenario.title)}</title>`);
    const path = resolve(docsRoot, scenario.file);
    await mkdir(dirname(path), { recursive: true });
    try { if (await readFile(path, 'utf8') === html) continue; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await writeFile(path, html);
  }
}
