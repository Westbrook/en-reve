/** Source-authored exclusions that must survive consumers rebuilding inheritance. */
export const omittedCssPartsKey = 'x-en-reve-omitted-css-parts';
export function readOmittedCssParts(declaration: Record<string, any>): string[] {
  const value = declaration[omittedCssPartsKey];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(name => typeof name !== 'string' || !name || /[\u0000-\u0020\u007f]/u.test(name)) || new Set(value).size !== value.length) {
    throw new Error('Invalid source-authored CSS part omissions.');
  }
  return [...value];
}
