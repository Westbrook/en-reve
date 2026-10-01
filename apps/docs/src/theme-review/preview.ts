/// <reference types="vite/client" />
import { reopenReviewDraft, reopenThemeReviewPair } from '@en-reve/tokens';
import type { ResolvedTheme, ResolvedThemePair, ThemeReviewDraft } from '@en-reve/tokens';
import type { DocumentTheme } from './document-theme.js';

type PresentationTheme = ResolvedTheme | ResolvedThemePair;
type Appearance = 'auto' | 'light' | 'dark';

export interface ThemePreviewRequest {
  readonly type: 'en-theme-preview';
  readonly draftJSON: string;
  readonly direction: 'ltr' | 'rtl';
  readonly requestId: string;
  readonly buildFingerprint: string;
  readonly appearance?: Appearance;
}

type PreviewAttachment = { refresh(): boolean; disconnect(): void };
const attachments = new WeakMap<HTMLElement, PreviewAttachment>();

/** The bridge is available in embedded docs pages, including native navigations. */
export function isThemePreviewFrame(root: HTMLElement): boolean {
  const view = root.ownerDocument.defaultView;
  return Boolean(view && view.parent !== view);
}

/** Attach only after the app's original SSR template has hydrated. */
export function attachThemePreview(root: HTMLElement): void {
  if (attachments.has(root) || !isThemePreviewFrame(root)) return;
  const doc = root.ownerDocument;
  const view = doc.defaultView!;
  const parent = view.parent;
  const origin = view.location.origin;
  if (origin === 'null') return;
  const abort = new view.AbortController();
  const controlsStyle = doc.createElement('style');
  controlsStyle.dataset.enThemeReviewControls = '';
  controlsStyle.textContent = '[data-en-theme-preview] .theme-controls, [data-en-theme-preview] .site-header a[hidden] { display: none !important; }';
  let documentTheme: DocumentTheme | undefined;
  const controls = new Map<HTMLElement, { hidden: HTMLElement['hidden']; inert: boolean }>();
  let identity: Promise<string> | undefined;
  let generation = 0;
  let disconnected = false;
  let applied: { theme: PresentationTheme; direction: 'ltr' | 'rtl'; appearance: Appearance } | undefined;
  let validated: { json: string; draft?: ThemeReviewDraft; theme: PresentationTheme } | undefined;
  let original: { syntaxTheme: string | null; preview: string | null } | undefined;
  const systemDark = view.matchMedia('(prefers-color-scheme: dark)');
  const effectiveMode = (theme: PresentationTheme, appearance: Appearance) => 'light' in theme
    ? appearance === 'auto' ? systemDark.matches ? 'dark' : 'light' : appearance
    : theme.mode;

  const post = (message: object) => parent.postMessage(message, origin);
  const pageIdentity = () => ({
    pageId: root.querySelector<HTMLElement>('.workflow-section[id]')?.id ?? (root.matches('en-sticker-app') ? 'sheet' : 'unknown'),
    actualPath: view.location.pathname,
  });
  const refresh = (): boolean => {
    if (disconnected || !applied || !root.isConnected || root.ownerDocument !== doc) return false;
    if (controlsStyle.parentNode !== doc.head) doc.head.append(controlsStyle);
    if (!documentTheme?.refresh()) return false;
    root.setAttribute('data-en-theme-preview', '');
    root.dataset.syntaxTheme = effectiveMode(applied.theme, applied.appearance) === 'light' ? 'github' : 'night-owl';
    for (const section of root.querySelectorAll<HTMLElement>('.theme-controls, .site-header a[href]')) {
      if (section instanceof view.HTMLAnchorElement
        && !['/theme-review', '/theme-review.html', '/theme-review/'].includes(new URL(section.href, doc.baseURI).pathname)) continue;
      if (!controls.has(section)) controls.set(section, { hidden: section.hidden, inert: section.inert });
      section.hidden = true;
      section.inert = true;
    }
    return true;
  };

  const attachment: PreviewAttachment = {
    refresh,
    disconnect() {
      if (disconnected) return;
      disconnected = true;
      generation++;
      abort.abort();
      documentTheme?.disconnect();
      documentTheme = undefined;
      controlsStyle.remove();
      for (const [section, previous] of controls) {
        if (section.hidden === true) section.hidden = previous.hidden;
        if (section.inert) section.inert = previous.inert;
      }
      if (original && applied) {
        const syntax = effectiveMode(applied.theme, applied.appearance) === 'light' ? 'github' : 'night-owl';
        if (root.getAttribute('data-syntax-theme') === syntax) restoreAttribute(root, 'data-syntax-theme', original.syntaxTheme);
        if (root.getAttribute('data-en-theme-preview') === '') restoreAttribute(root, 'data-en-theme-preview', original.preview);
      }
      attachments.delete(root);
    },
  };
  attachments.set(root, attachment);
  systemDark.addEventListener('change', () => { if (applied?.appearance === 'auto') refresh(); }, {signal:abort.signal});

  view.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== origin || !isRecord(event.data) || event.data.type !== 'en-theme-preview') return;
    const message = event.data;
    if (typeof message.requestId !== 'string' || !message.requestId) return;
    const requestId = message.requestId;
    const current = ++generation;
    void (async () => {
      try {
        if (typeof message.draftJSON !== 'string'
          || (message.direction !== 'ltr' && message.direction !== 'rtl')
          || typeof message.buildFingerprint !== 'string' || !message.buildFingerprint
          || (message.appearance !== undefined && !['auto','light','dark'].includes(String(message.appearance)))) {
          throw new TypeError('Theme preview requires a draft, direction and build fingerprint.');
        }
        const buildFingerprint = await (identity ??= readBuildFingerprint(view, abort.signal));
        if (current !== generation || disconnected || !root.isConnected || root.ownerDocument !== doc) return;
        if (message.buildFingerprint !== buildFingerprint) {
          throw new Error('Theme preview build does not match the review page. Reload both previews.');
        }
        // Validate/regenerate only the latest request after the identity fetch.
        // No CSS, HTML, URLs or arbitrary selectors are accepted from messages.
        let next = validated;
        if (next?.json !== message.draftJSON) {
          if (message.draftJSON.length > 8_000_000) throw new Error('The preview draft is too large.');
          const envelope = JSON.parse(message.draftJSON) as unknown;
          if (isRecord(envelope) && envelope.schema === 'en-reve/theme-review-pair') {
            const opened = reopenThemeReviewPair(message.draftJSON);
            next = {json:message.draftJSON,theme:opened.theme};
          } else {
            const draft = reopenReviewDraft(message.draftJSON, { previousDraft: validated?.draft });
            const theme = draft.theme;
            next = { json: message.draftJSON, draft, theme };
          }
        }
        const { theme } = next;
        const appearance: Appearance = message.appearance as Appearance | undefined ?? ('light' in theme ? 'auto' : theme.mode);
        // Load trusted companion recipes only for an accepted preview request.
        const { attachDocumentTheme } = await import('./document-theme.js');
        if (current !== generation || disconnected || !root.isConnected || root.ownerDocument !== doc) return;
        documentTheme ??= attachDocumentTheme({ root, styleAttribute: 'data-en-theme-review' });
        if (!documentTheme.apply(theme, { direction: message.direction, appearance })) return;
        original ??= {
          syntaxTheme: root.getAttribute('data-syntax-theme'),
          preview: root.getAttribute('data-en-theme-preview'),
        };
        applied = { theme, direction: message.direction, appearance };
        if (!refresh()) return;
        validated = next;
        const caseIds = [...new Set([
          ...[...root.querySelectorAll<HTMLElement>('[data-specimen]')].map(element => element.dataset.specimen!),
          ...[...root.querySelectorAll<HTMLElement>('.workflow-section[id]')].map(element => element.id),
        ].filter(Boolean))];
        post({ type: 'en-theme-preview-ready', requestId, sourceHash: theme.sourceHash, buildFingerprint, caseIds, direction: applied.direction, appearance, effectiveMode:effectiveMode(theme,appearance), ...pageIdentity() });
      } catch (error) {
        if (current !== generation || disconnected || root.ownerDocument !== doc) return;
        post({ type: 'en-theme-preview-error', requestId, message: error instanceof Error ? error.message : 'Could not apply the review draft.', ...pageIdentity() });
      }
    })();
  }, { signal: abort.signal });
  // The parent also sends on iframe load; this announcement covers a message
  // sent before hydration had installed the listener.
  post({ type: 'en-theme-preview-listening', ...pageIdentity() });
}

/** Keep the parent-owned theme authoritative across ordinary local app updates. */
export function refreshThemePreview(root: HTMLElement): boolean {
  return attachments.get(root)?.refresh() ?? false;
}

export function disconnectThemePreview(root: HTMLElement): void {
  attachments.get(root)?.disconnect();
}

async function readBuildFingerprint(view: Window, signal: AbortSignal): Promise<string> {
  let manifest: unknown;
  try {
    const response = await view.fetch(new URL('/review-build.json', view.location.href), { cache: 'no-store', credentials: 'same-origin', signal });
    if (!response.ok) throw new Error(`Review build identity is unavailable (${response.status}).`);
    manifest = await response.json();
  } catch (error) {
    if (import.meta.env.DEV && !signal.aborted) return 'development';
    throw error;
  }
  if (!isRecord(manifest) || manifest.schemaVersion !== 1
    || typeof manifest.fingerprint !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(manifest.fingerprint)) {
    throw new Error('Review build identity is invalid. Rebuild the review page and previews together.');
  }
  if (view.document.querySelector<HTMLMetaElement>('meta[name="en-review-build"]')?.content !== manifest.fingerprint) {
    throw new Error('This preview page belongs to a different build. Reload the preview before continuing.');
  }
  return manifest.fingerprint;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function restoreAttribute(element: Element, name: string, previous: string | null): void {
  if (previous === null) element.removeAttribute(name);
  else element.setAttribute(name, previous);
}
