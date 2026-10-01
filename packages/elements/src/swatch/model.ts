/** Canonical generated token names; CSS escapes and arbitrary expressions are not accepted. */
const tokenName = /^--en-[A-Za-z0-9_-]+$/u;

function tokenReference(token: unknown): string | undefined {
  return typeof token === 'string' && tokenName.test(token) ? `var(${token})` : undefined;
}

/**
 * Keep paint within one SSR-safe background-color declaration. The browser still
 * validates the color grammar. Assigning the whole declaration clears old paint
 * when a new color is unsupported instead of retaining a previous CSSOM value.
 */
export function swatchColor(token: unknown, color: unknown): string {
  if (token) return tokenReference(token) ?? '';
  if (typeof color !== 'string' || /[;{}\\!]/u.test(color)) return '';
  return color.trim();
}
