import { defaultCSSValue } from '@en-reve/tokens/defaults.js';
import { sizingRoleCSS } from '@en-reve/tokens/sizing.js';

/** Shared build/runtime serialization of trusted token references. */
export function rawTokenCSS(name: string): string {
  const value = defaultCSSValue(name);
  if (!value) throw new Error(`Missing stylesheet token default: ${name}`);
  return `var(${name}, ${value})`;
}
const sizedRoles = new Map<string, string>(sizingRoleCSS.map(({base, role}) => [base, `--_en-sized-${role.slice(5)}`]));
export function tokenCSS(name: string): string {
  const fallback = rawTokenCSS(name);
  const sized = sizedRoles.get(name);
  return sized ? `var(${sized}, ${fallback})` : fallback;
}
