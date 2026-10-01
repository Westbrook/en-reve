import type { ThemeCSSOptions } from './types.js';
import { TokenError } from './value.js';

function validate(selector: string): string {
  if (!selector.trim() || /[{}\u0000]/.test(selector)) throw new TokenError('invalid-selector','Selector must be nonempty and must not include a rule body.');
  return selector;
}

/** Host conditions belong inside :host(). Custom selector grammars are never rewritten. */
export function themeScopeSelectors(name: string, options: ThemeCSSOptions = {}) {
  const target = options.target ?? (options.selector === ':host' ? 'shadow-host' : options.scope === 'root' ? 'root' : 'element');
  if (!['root','element','shadow-host'].includes(target)) throw new TokenError('invalid-target','Unknown theme emission target.');
  if (options.target && options.scope) throw new TokenError('conflicting-target','Use target or legacy scope, not both.');
  if (target === 'shadow-host' && options.selector && options.selector !== ':host') throw new TokenError('conflicting-target','A shadow-host target uses :host; use explicit appearanceSelectors for a custom selector.');
  if (options.target === 'root' && options.selector) throw new TokenError('conflicting-target','A root target uses :root; use the element target for a custom selector.');
  const selector = validate(options.selector ?? (target === 'shadow-host' ? ':host' : target === 'root' ? ':root' : `[data-en-theme="${name}"]`));
  const boundary = `:where(${selector})`;
  const condition = (value: string) => target === 'shadow-host' ? `:where(:host(${value}))` : `${boundary}:where(${value})`;
  const slots = options.appearanceSelectors;
  return {
    selector, boundary,
    auto: validate(slots?.auto ?? condition(':not([data-en-appearance="light"], [data-en-appearance="dark"])')),
    light: validate(slots?.light ?? condition('[data-en-appearance="light"]')),
    dark: validate(slots?.dark ?? condition('[data-en-appearance="dark"]')),
  };
}
