import type { ResolvedTheme, ThemeDiagnostic } from './types.js';
import { customizationContracts } from './customization.js';
import { hashValue } from './hash.js';
import { deepFreeze, TokenError } from './value.js';
import { controlTargets, controlPresentations } from './companion/controls.js';
import { displayTargets, displayPresentations } from './companion/display.js';
import { feedbackTargets, feedbackPresentations } from './companion/feedback.js';
import { navigationTargets, navigationPresentations } from './companion/navigation.js';
import { collectionsTargets, collectionsPresentations } from './companion/collections.js';
import { specializedTargets, specializedPresentations } from './companion/specialized.js';
import { typographyTargets, typographyPresentations } from './companion/typography.js';
import type { CompanionPresentationRegistry } from './companion/presentation.js';
import { spectrumTargets, spectrumPresentations } from './companion/spectrum.js';
import { spectrumTabsTargets, spectrumTabsPresentations } from './companion/spectrum-tabs.js';
import { fluentTargets, fluentPresentations } from './companion/fluent.js';
import { astryxTargets, astryxPresentations } from './companion/astryx.js';
import { sourceShapeTargets, sourceShapePresentations } from './companion/source-shapes.js';
import { radixTargets, radixPresentations } from './companion/radix.js';
import { sliderTargets, sliderPresentations } from './companion/slider.js';
import { webAwesomeDetailsTargets, webAwesomeDetailsPresentations } from './companion/web-awesome-details.js';
import { sourceAlertTargets, sourceAlertPresentations } from './companion/source-alert.js';

/** Opt-in: application-owned component tokens remain legal. Warnings don't affect identity. */
export function unknownComponentHooks(theme: Pick<ResolvedTheme, 'tokens'>): readonly ThemeDiagnostic[] {
  const contracts = customizationContracts(theme as ResolvedTheme);
  return Object.values(theme.tokens).filter(token => token.id.startsWith('component.'))
    .filter(token => !contracts.some(c => c.cssName === token.cssName && c.consumerStatus === 'connected'))
    .map(token => ({code:'unknown-component-hook', tokens:[token.id], message:`${token.cssName} has no registered library consumer. Check spelling or document its application-owned consumer.`}));
}

export interface ThemeRoleProvenance {
  readonly tokenId: string;
  readonly kind: 'measured' | 'published' | 'adaptation';
  readonly sourceUrl: string;
  readonly sourceHash: string;
  readonly selector: string;
  readonly appearance: 'light' | 'dark';
  readonly viewport: { readonly width: number; readonly height: number } | null;
  readonly note: string;
}
export function validateRoleProvenance(theme: ResolvedTheme, entries: readonly ThemeRoleProvenance[]): readonly ThemeRoleProvenance[] {
  for (const entry of entries) {
    if (!theme.tokens[entry.tokenId] || !['measured','published','adaptation'].includes(entry.kind)
      || !/^https:\/\//.test(entry.sourceUrl) || !/^sha256:[a-f0-9]{64}$/.test(entry.sourceHash)
      || !entry.selector.trim() || !entry.note.trim() || entry.appearance !== theme.mode
      || (entry.kind === 'measured' && (!entry.viewport || !Number.isFinite(entry.viewport.width) || !Number.isFinite(entry.viewport.height) || entry.viewport.width <= 0 || entry.viewport.height <= 0))) {
      throw new TokenError('invalid-role-provenance','Record a known role, source digest, selector, matching appearance, note and measured viewport.',entry.tokenId);
    }
  }
  return deepFreeze(entries.map(entry => ({...entry,viewport:entry.viewport ? {...entry.viewport} : null})));
}

const targets = {
  button: ['en-button', 'en-toggle-button', '.en-button'],
  choice: ['en-checkbox', 'en-switch', 'en-radio', '.en-choice'],
  link: ['en-link', '.en-link'],
  'segmented-control': ['en-segmented-control'],
  'reset-action': ['en-button[data-en-action="reset"]', '.en-button[data-en-action="reset"]'],
  'standalone-action': ['en-button[data-en-action="standalone"]', '.en-button[data-en-action="standalone"]'],
  field: ['en-text-field','en-search-input','en-textarea','en-select','en-combobox','en-number-field','en-date-input','en-date-picker','en-multiselect','en-token-editor','.en-input','.en-textarea','.en-select'],
  ...controlTargets, ...displayTargets, ...feedbackTargets,
  ...navigationTargets, ...collectionsTargets, ...specializedTargets, ...typographyTargets,
  ...spectrumTargets, ...spectrumTabsTargets, ...fluentTargets, ...astryxTargets, ...sourceShapeTargets, ...radixTargets, ...sliderTargets, ...webAwesomeDetailsTargets, ...sourceAlertTargets,
} as const;
const presentations = {
  ...controlPresentations, ...displayPresentations, ...feedbackPresentations,
  ...navigationPresentations, ...collectionsPresentations, ...specializedPresentations, ...typographyPresentations,
  ...spectrumPresentations, ...spectrumTabsPresentations, ...fluentPresentations, ...astryxPresentations, ...sourceShapePresentations, ...radixPresentations, ...sliderPresentations, ...webAwesomeDetailsPresentations, ...sourceAlertPresentations,
} as const satisfies CompanionPresentationRegistry;
type PresentationNames<Registry> = { [Target in keyof Registry]: keyof Registry[Target] }[keyof Registry] & string;
export interface ThemeCompanionRule {
  readonly target: keyof typeof targets;
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'neutral' | 'success' | 'warning';
  /** Finite code-owned recipes over public Parts; no imported selectors or CSS. */
  readonly presentation?: 'joined' | 'dotted-underline' | 'stretch' | PresentationNames<typeof presentations>;
  /** Assign registered hooks from typed token values; never accept imported CSS. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Finite presentation-owned roles receive typed token IDs, never CSS text. */
  readonly roles?: Readonly<Record<string, string>>;
}
export interface ThemeCompanionRecipe {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly rules: readonly ThemeCompanionRule[];
}
/** Code-authored variant recipe, separate from exact-build review envelopes.
 * Only known hosts/native classes and registered typed hooks are accepted.
 * Named style queries stop at descendant full-theme boundaries and follow theme CSS. Token
 * assignments have zero specificity; presentation rules match public Parts/classes. */
export function createThemeCompanion(theme: ResolvedTheme, recipe: ThemeCompanionRecipe, options: {name?: string} = {}) {
  const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object'
    && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const keys = (value: object, allowed: readonly string[]) => Object.keys(value).every(key => allowed.includes(key));
  const tokenMap = (value: unknown) => record(value) && Object.entries(value).every(([key, id]) => !['__proto__', 'constructor', 'prototype'].includes(key) && typeof id === 'string');
  if (!record(recipe) || !keys(recipe, ['schemaVersion', 'id', 'rules']) || recipe.schemaVersion !== 1
    || typeof recipe.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(recipe.id) || !Array.isArray(recipe.rules)) throw new TokenError('invalid-companion','Unsupported companion recipe.');
  const contracts = customizationContracts(theme);
  const name = options.name ?? theme.name;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) throw new TokenError('invalid-companion','Companion boundary names must be lowercase kebab-case.');
  const scope = `[data-en-theme="${name}"][data-en-appearance="${theme.mode}"]`;
  const marker = `--en-companion-${name}-${theme.mode}`;
  // Query the actual full-theme boundary rather than a Part's originating host.
  // This avoids engine differences in @scope/::part and inherited style-query
  // invalidation while keeping public var() hooks evaluated at their final Part.
  const style = (selectors: readonly string[], css: string): string => {
    if (!css || !selectors.length) return '';
    const atSubject = (target: string, guard: string): string => {
      const pseudo = target.indexOf('::');
      return pseudo < 0 ? target + guard : target.slice(0, pseudo) + guard + target.slice(pseudo);
    };
    const descendants = selectors.map(selector => atSubject(selector, ':not(:where([data-en-theme]))'));
    const roots = selectors.map(selector => atSubject(selector, `:where(${scope})`));
    return `@container --en-theme-companion style(${marker}: 1) {\n${descendants.join(',\n')} { ${css} }\n}\n${roots.join(',\n')} { ${css} }`;
  };
  const rules = recipe.rules.map((rule: ThemeCompanionRule) => {
    if (!record(rule) || !keys(rule, ['target', 'variant', 'presentation', 'tokens', 'roles']) || !tokenMap(rule.tokens)
      || (Object.hasOwn(rule, 'roles') && !tokenMap(rule.roles))) throw new TokenError('invalid-companion','Companion rules require typed token maps and known fields.');
    if (typeof rule.target !== 'string' || !Object.hasOwn(targets,rule.target) || (rule.variant !== undefined && !(rule.target === 'button' && ['primary','secondary','ghost','danger'].includes(rule.variant) || rule.target === 'badge' && ['neutral','accent','success','warning','danger'].includes(rule.variant)))) throw new TokenError('invalid-companion','Unsupported target or variant.');
    const available = Object.hasOwn(presentations, rule.target) ? (presentations as CompanionPresentationRegistry)[rule.target] : undefined;
    const presentation = typeof rule.presentation === 'string' && available && Object.hasOwn(available, rule.presentation) ? available[rule.presentation] : undefined;
    const legacy = (rule.target === 'segmented-control' && rule.presentation === 'joined') || (rule.target === 'link' && rule.presentation === 'dotted-underline') || (rule.target === 'standalone-action' && rule.presentation === 'stretch');
    if (rule.presentation !== undefined && !presentation && !legacy) throw new TokenError('invalid-companion','Unsupported target presentation.');
    if (rule.roles !== undefined && !presentation) throw new TokenError('invalid-companion','Typed roles require a registered component presentation.');
    for (const [role, id] of Object.entries(rule.roles ?? {})) {
      if (!presentation || !Object.hasOwn(presentation.roles, role) || !Object.hasOwn(theme.tokens, id)
        || theme.tokens[id].type !== presentation.roles[role]) throw new TokenError('invalid-companion','Presentation roles require a known role and compatible typed token.', id);
    }
    const declarations = Object.entries(rule.tokens).sort(([a],[b]) => a.localeCompare(b)).map(([name,id]) => {
      const contract = contracts.find(c => c.cssName === name);
      const token = Object.hasOwn(theme.tokens, id) ? theme.tokens[id] : undefined;
      // Core typography roles are public, inherited inputs. Limit companion
      // assignment to known roles instead of allowing arbitrary imported CSS.
      const typography = contract?.kind === 'semantic' && contract.family === 'typography'
        && /^--en-font-(?:ui|input|metadata|body|label-strong)-(?:family|size(?:-small|-medium|-large)?|weight|line-height|style|tracking)$/.test(name);
      const hook = contract?.kind === 'override' && contract.consumerStatus === 'connected';
      if (!contract || (!hook && !typography) || !contract.tokenType || token?.type !== contract.tokenType) throw new TokenError('invalid-companion','Companions require a registered typed hook or public typography role and a compatible token.',id);
      return `  ${name}: ${token.cssValue};`;
    });
    const selectors = targets[rule.target].flatMap(target => {
      const attribute = target.startsWith('.') ? 'data-variant' : 'variant';
      const variant = rule.variant ? `[${attribute}="${rule.variant}"]` : '';
      const matches = [`:where(${target}${variant})`];
      // Respect each public action's omitted-variant default. Keep fallback
      // branches separate so native presentation recipes identify their class.
      if (rule.target === 'button' && rule.variant === (target === 'en-toggle-button' ? 'secondary' : 'primary')) {
        const aliases = target.startsWith('.') ? ':where(:not(.en-button--secondary, .en-button--quiet, .en-button--danger))' : '';
        matches.push(`:where(${target}):where(:not([${attribute}]))${aliases}`);
      }
      return matches;
    });
    const base = style(selectors, declarations.join('\n'));
    const block = (suffix: string, css: string) => style(selectors.map(selector => selector + suffix), css);
    if (presentation) return base + '\n' + presentation.render({ selectors, style, block, role: role => {
      const id = rule.roles?.[role];
      return id === undefined ? undefined : theme.tokens[id].cssValue;
    } });
    if (rule.presentation === 'stretch') return base + '\n' + block('', 'inline-size: 100%; max-inline-size: 100%;') + '\n' + block('::part(control)', 'inline-size: 100%;');
    if (rule.presentation === 'dotted-underline') {
      const links = [selectors[0] + '::part(control)', selectors[1] + '.en-link'];
      return base + '\n' + style(links, 'color: var(--en-color-link); text-decoration: underline dotted; text-decoration-color: color-mix(in oklab, currentColor 70%, transparent); text-underline-offset: .1em;')
        + '\n' + style(links.map(s => s + ':hover'), 'text-decoration-style: solid; text-decoration-color: currentColor;');
    }
    if (rule.presentation === 'joined') return base + '\n' + [
      block('::part(options)', 'inline-size: fit-content; max-inline-size: 100%; flex-wrap: nowrap; gap: 0; padding: 0; border: 0; border-radius: 0; background: transparent; min-block-size: 0;'),
      block('::part(option)', 'flex: 0 1 auto; min-inline-size: var(--en-size-target-min); min-block-size: max(var(--en-size-target-min), var(--en-size-control-min)); padding: var(--en-space-control-block) var(--en-space-control-inline); border: var(--en-border-width) solid var(--en-color-boundary); border-radius: 0; background: var(--en-color-surface); color: var(--en-color-text); font-weight: var(--en-font-ui-weight);'),
      block('::part(option-joined)', 'margin-inline-start: calc(-1 * var(--en-border-width));'),
      block('::part(option-start)', 'border-start-start-radius: var(--en-radius-control); border-end-start-radius: var(--en-radius-control);'),
      block('::part(option-end)', 'border-start-end-radius: var(--en-radius-control); border-end-end-radius: var(--en-radius-control);'),
      block('::part(option-selected)', 'position: relative; z-index: 1; background: var(--en-color-selected); border-color: var(--en-color-action);'),
      block('::part(option-enabled):hover', 'background: var(--en-color-selected);'),
      block('::part(option-enabled):active', 'background: var(--en-color-accent-subtle);'),
      block('::part(option-disabled)', 'color: var(--en-color-text-muted); cursor: default;'),
      block('::part(option):focus-within', 'z-index: 2;'),
      `@media (any-pointer: coarse) { ${block('::part(option)', 'min-block-size: var(--en-size-target-touch); min-inline-size: var(--en-size-target-touch);')} }`,
      `@media (forced-colors: active) { ${block('::part(option)', 'background: Canvas; color: CanvasText; border-color: ButtonText;')} ${block('::part(option-selected)', 'background: Highlight; color: HighlightText; border-color: Highlight;')} ${block('::part(option-disabled)', 'color: GrayText;')} }`,
    ].join('\n');
    return base;
  });
  // Every full boundary resets inherited activity, including repeated names.
  // Activation outranks the zero-weight reset: the paired compiler later copies
  // each branch into an auto-appearance media rule, including its reset.
  const css = `:where([data-en-theme]) { container-name: --en-theme-companion; ${marker}: initial; }\n${scope} { ${marker}: 1; }\n${rules.join('\n')}\n`;
  return deepFreeze({schemaVersion:1 as const,kind:'theme-companion' as const,id:recipe.id,sourceHash:theme.sourceHash,recipe,css,identity:hashValue({recipe,sourceHash:theme.sourceHash,css})});
}
