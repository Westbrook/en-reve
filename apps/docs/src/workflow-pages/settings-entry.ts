import { startWorkflowPage } from '../workflows-client.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/toast-region.js';
import '@en-reve/elements/define/slider.js';
import '@en-reve/elements/define/menu.js';
import '@en-reve/elements/define/menu-item.js';
import '@en-reve/elements/define/toolbar.js';
import '@en-reve/elements/define/tree.js';
import '@en-reve/elements/define/tree-item.js';
import '@en-reve/elements/define/tooltip.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
const commands = createDefinitionLoader(customElements, {
  'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js').then(module => module.commandPaletteDefinition),
});
// Route-entry preparation is load-only and never delays workflow hydration.
void commands.load(['en-command-palette']).catch(() => { /* Explicit opening owns retry and error feedback. */ });
import { createSettingsWorkflowApp } from './settings.js';
import { settingsScenarios } from '../workflows/settings/scenarios.js';

// The document declares its SSR scenario. Query parameters only control the
// preview after hydration; they cannot select a different initial template.
const scenario = document.querySelector('en-workflows-app')?.getAttribute('data-settings-scenario');
await startWorkflowPage(createSettingsWorkflowApp(settingsScenarios.find(item => item.id === scenario)?.id ?? 'explore', options => commands.ensure(['en-command-palette'], options), async options => { await commands.load(['en-command-palette'], options); }));
