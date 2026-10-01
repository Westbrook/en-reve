/** Resolve a flat message group without mutating caller data. Empty strings are intentional. */
export function resolveMessages<T extends Record<string, string>>(defaults: T, overrides?: Partial<T> | null): T {
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, overrides?.[key] ?? fallback])) as T;
}
