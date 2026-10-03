import type { TokenType } from '../types.js';

/** Trusted component anatomy; imported recipes contain token IDs, never CSS. */
export interface CompanionPresentationContext {
  readonly selectors: readonly string[];
  readonly role: (name: string) => string | undefined;
  readonly style: (selectors: readonly string[], declarations: string) => string;
  readonly block: (suffix: string, declarations: string) => string;
}

export interface CompanionPresentationDefinition {
  readonly roles: Readonly<Record<string, TokenType>>;
  readonly render: (context: CompanionPresentationContext) => string;
}

export type CompanionPresentationRegistry = Readonly<Record<string,
  Readonly<Record<string, CompanionPresentationDefinition>>>>;

/** Missing optional roles preserve the component's ordinary declaration. */
export function declarations(values: Readonly<Record<string, string | undefined>>): string {
  return Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([property, value]) => `${property}: ${value};`).join(' ');
}

/** Component system-color rules remain authoritative for author color/paint. */
export function authorPaint(css: string): string {
  return css ? `@media (forced-colors: none) { ${css} }` : '';
}

/** Match documented native recipe specificity for paint/layout declarations.
 * Keep type guards in :where() so they add no specificity.
 * Hook defaults continue to use the original zero-specificity selector. */
export function nativeSurface(selector: string): string {
  return selector.replace(/:where\(([a-z][\w-]*)?(\.[\w-]+(?:\[data-variant="(?:primary|secondary|ghost|danger|accent|neutral|success|warning)"\])?(?: > \.[\w-]+)?)\)/g,
    (_, tag: string | undefined, surface: string) => `${tag ? `:where(${tag})` : ''}${surface}`);
}
