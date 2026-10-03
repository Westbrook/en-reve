import { emitThemeCSS, emitThemePairCSS } from '@en-reve/tokens';
import type { ResolvedTheme, ResolvedThemePair } from '@en-reve/tokens';

import { presetCompanion } from './companion.js';

type PresentationTheme = ResolvedTheme | ResolvedThemePair;
type Appearance = 'auto' | 'light' | 'dark';

export interface DocumentThemeOptions {
  /** The hydrated app that owns this document's candidate presentation. */
  root: HTMLElement;
  /** Fixed docs-owned token boundary; omit for the normal document root. */
  selector?: 'html[data-example-density]';
  /** Preserve the consuming surface's existing stylesheet marker. */
  styleAttribute?: 'data-en-document-theme' | 'data-example-theme' | 'data-en-theme-review';
  /** False when app controls and paired CSS own appearance and color scheme. */
  manageAppearance?: boolean;
}

export interface DocumentTheme {
  /** Apply a compiler-resolved theme, never CSS or an object copied directly from an imported file. */
  apply(theme: PresentationTheme, options?: { direction?: 'ltr' | 'rtl'; appearance?: Appearance }): boolean;
  /** Reassert active presentation after ordinary app updates, without replacing any app nodes. */
  refresh(): boolean;
  /** Remove candidate presentation and restore document values still owned by this controller. */
  reset(): void;
  /** Reset and release ownership. Attach again if the app reconnects. */
  disconnect(): void;
}

const attachments = new WeakMap<Document, { root: HTMLElement; options: Omit<DocumentThemeOptions, 'root'>; controller: DocumentTheme }>();

/**
 * Docs-local presentation controller. Validate imported files with reopenReviewBundle
 * before passing its draft.theme here. Construct after the initial SSR tree hydrates.
 * This owns one document, not embedded documents or nested explicit theme scopes.
 */
export function attachDocumentTheme({ root, selector, styleAttribute = 'data-en-document-theme', manageAppearance = true }: DocumentThemeOptions): DocumentTheme {
  const document = root.ownerDocument;
  if (!document.defaultView) return { apply: () => false, refresh: () => false, reset() {}, disconnect() {} };
  const existing = attachments.get(document);
  if (existing) {
    if (existing.root !== root) throw new TypeError('This document already has a theme presentation owner.');
    if (existing.options.selector !== selector || existing.options.styleAttribute !== styleAttribute || existing.options.manageAppearance !== manageAppearance) {
      throw new TypeError('This theme presentation owner already has different attachment options.');
    }
    return existing.controller;
  }

  const html = document.documentElement;
  const style = document.createElement('style');
  style.setAttribute(styleAttribute, '');
  const emission = selector ? { selector } : { scope: 'root' as const };
  let disconnected = false;
  let cache: { theme: PresentationTheme; css: string } | undefined;
  let applied: { theme: PresentationTheme; direction?: 'ltr' | 'rtl'; appearance: Appearance } | undefined;
  let original: { dir: string | null; colorScheme: string; colorSchemePriority: string; appearance: string | null; name: string | null } | undefined;
  let writtenDirection: string | undefined;
  let writtenColorScheme: string | undefined;
  let writtenAppearance: Appearance | undefined;
  let writtenName: string | undefined;

  const connected = () => !disconnected && root.isConnected && root.ownerDocument === document && Boolean(document.body ?? document.head);
  const restoreDirection = () => {
    if (writtenDirection !== undefined && html.getAttribute('dir') === writtenDirection && original) {
      if (original.dir === null) html.removeAttribute('dir');
      else html.setAttribute('dir', original.dir);
    }
    writtenDirection = undefined;
  };
  const restoreAppearance = () => {
    if (writtenAppearance !== undefined && html.getAttribute('data-en-appearance') === writtenAppearance && original) {
      if (original.appearance === null) html.removeAttribute('data-en-appearance');
      else html.setAttribute('data-en-appearance', original.appearance);
    }
    writtenAppearance = undefined;
  };
  const refresh = (): boolean => {
    if (!applied || !connected()) return false;
    // Native recipe styles may be loaded by body content. Keep the owned
    // candidate after them without moving or replacing application nodes.
    const styleParent = document.body ?? document.head;
    if (styleParent.lastElementChild !== style) styleParent.append(style);
    html.setAttribute('data-en-theme', applied.theme.name);
    writtenName = applied.theme.name;
    if (manageAppearance) {
      const paired = 'light' in applied.theme;
      const mode = 'light' in applied.theme ? applied.appearance === 'auto' ? 'light dark' : applied.appearance : applied.theme.mode;
      if (paired) {
        html.setAttribute('data-en-appearance', applied.appearance);
        writtenAppearance = applied.appearance;
      } else restoreAppearance();
      if (html.style.getPropertyValue('color-scheme') !== mode || html.style.getPropertyPriority('color-scheme')) {
        // Clear priority before taking temporary ownership; the complete original
        // value and priority are preserved for reset.
        if (html.style.getPropertyPriority('color-scheme')) html.style.removeProperty('color-scheme');
        html.style.setProperty('color-scheme', mode);
      }
      writtenColorScheme = mode;
    }
    if (applied.direction === undefined) restoreDirection();
    else {
      if (html.getAttribute('dir') !== applied.direction) html.setAttribute('dir', applied.direction);
      writtenDirection = applied.direction;
    }
    return true;
  };
  const reset = (): void => {
    style.remove();
    if (original && writtenName !== undefined && html.getAttribute("data-en-theme") === writtenName) {
      if (original.name === null) html.removeAttribute("data-en-theme"); else html.setAttribute("data-en-theme", original.name);
    }
    writtenName = undefined;
    restoreDirection();
    restoreAppearance();
    if (original && writtenColorScheme !== undefined &&
      html.style.getPropertyValue('color-scheme') === writtenColorScheme && !html.style.getPropertyPriority('color-scheme')) {
      if (original.colorScheme) html.style.setProperty('color-scheme', original.colorScheme, original.colorSchemePriority);
      else html.style.removeProperty('color-scheme');
    }
    applied = undefined;
    original = undefined;
    writtenColorScheme = undefined;
  };

  const controller: DocumentTheme = {
    apply(theme, { direction, appearance = 'auto' } = {}) {
      if (!connected()) return false;
      // Generate before changing presentation, so a serialization failure leaves
      // the previously applied candidate and document attributes intact.
      if (cache?.theme !== theme) cache = { theme, css: ('light' in theme ? emitThemePairCSS(theme, emission) : emitThemeCSS(theme, emission)) + (presetCompanion(theme)?.css ?? '') };
      original ??= {
        dir: html.getAttribute('dir'),
        colorScheme: html.style.getPropertyValue('color-scheme'),
        colorSchemePriority: html.style.getPropertyPriority('color-scheme'),
        appearance: html.getAttribute('data-en-appearance'),
        name: html.getAttribute('data-en-theme'),
      };
      if (style.textContent !== cache.css) style.textContent = cache.css;
      applied = { theme, direction, appearance };
      return refresh();
    },
    refresh,
    reset,
    disconnect() {
      if (disconnected) return;
      reset();
      disconnected = true;
      cache = undefined;
      if (attachments.get(document)?.controller === controller) attachments.delete(document);
    },
  };
  attachments.set(document, { root, options: { selector, styleAttribute, manageAppearance }, controller });
  return controller;
}
