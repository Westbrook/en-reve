import { MultiStepWorkflowApp } from '../src/workflow-pages/multi-step.js';
import { ShowcaseApp } from '../src/showcase/app.js';
import { ConversationApp } from '../src/conversation/app.js';
import { ThemeReviewApp } from '../src/theme-review/app.js';
import { createAPIExampleApp } from '../src/api-example/app.js';
import { APIReferenceApp } from '../src/api-reference/app.js';
import { specimens } from '../src/examples.js';
import { VirtualCollectionDemo } from '../src/virtual-collection-demo.js';
import { registerAll } from '@en-reve/elements/catalog.js';
import { renderToString } from '../../../packages/ssr/dist/index.js';
import { StickerApp } from '../src/app.js';
import { SignInWorkflowApp } from '../src/workflow-pages/sso.js';
import { SettingsWorkflowApp, createSettingsWorkflowApp } from '../src/workflow-pages/settings.js';
import type { SettingsScenarioId } from '../src/workflows/settings/scenarios.js';
import { ChatWorkflowApp } from '../src/workflow-pages/chat.js';
import { SelectionWorkflowApp } from '../src/workflow-pages/selection.js';
import { AssetsWorkflowApp } from '../src/workflow-pages/assets.js';
import type { WorkflowId } from '../src/workflow-pages/navigation.js';
export { workflowPages } from '../src/workflow-pages/navigation.js';

registerAll();
if (!customElements.get('en-virtual-collection-demo')) customElements.define('en-virtual-collection-demo', VirtualCollectionDemo);
export async function renderShowcase() {
  const app = new ShowcaseApp();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: app.previewCSS, tags: [...tags].sort() };
}

export async function renderConversation() {
  const app = new ConversationApp();
  await app.prepareTheme();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: app.previewCSS, tags: [...tags].sort() };
}


/** A new app instance owns all mutable Signals for this render. */
export async function renderStickerSheet() {
  const app = new StickerApp();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: app.previewCSS, tags: [...tags].sort() };
}

const workflowApplications = { 'multi-step': MultiStepWorkflowApp, sso: SignInWorkflowApp, settings: SettingsWorkflowApp, chat: ChatWorkflowApp, selection: SelectionWorkflowApp, assets: AssetsWorkflowApp };

/** Explicit page selection matches each client subclass and creates one fixture. */
export async function renderWorkflows(page: WorkflowId = 'sso', scenario?: SettingsScenarioId) {
  const App = page === 'settings' && scenario ? createSettingsWorkflowApp(scenario) : workflowApplications[page];
  const app = new App();
  const tags = new Set<string>();
  try {
    const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
    return { markup, css: app.previewCSS, tags: [...tags].sort() };
  } finally {
    app.disposeWorkflows();
  }
}

export async function renderThemeReview() {
  const app = new ThemeReviewApp();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: app.previewCSS, tags: [...tags].sort() };
}
export const reviewCaseIds = specimens.map(specimen => specimen.id);

export async function renderAPIReference() {
  const app = new APIReferenceApp();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: app.previewCSS, tags: [...tags].sort() };
}

export async function renderAPIExample(caseId: string) {
  const source = caseId === 'virtual-collection' ? (await import('../src/generated/virtual-collection-source.js')).default
    : caseId === 'tree-data' ? (await import('../src/generated/tree-data-source.js')).default
    : caseId === 'composable-chat' ? (await import('../src/generated/composable-chat-source.js')).default
    : caseId === 'rich-text' ? (await import('../src/generated/rich-text-source.js')).default
    : caseId === 'carousel' ? (await import('../src/generated/carousel-source.js')).default
    : caseId === 'presence-activity' ? (await import('../src/generated/presence-activity-source.js')).default
    : caseId === 'chat-patterns' ? (await import('../src/generated/chat-patterns-source.js')).default
    : caseId === 'toast' ? (await import('../src/generated/toast-source.js')).default
    : caseId === 'multi-step' ? (await import('../src/generated/multi-step-source.js')).default
    : caseId === 'calendar' ? (await import('../src/generated/calendar-source.js')).default : '';
  const App = createAPIExampleApp(caseId, source);
  const app = new App();
  const tags = new Set<string>();
  const markup = await renderToString(app.render(), { onCustomElementRendered: tag => tags.add(tag) });
  return { markup, css: '', tags: [...tags].sort() };
}
