/** Shared delivery vocabulary; components expose only modes they implement. */
export type CollectionMode = 'all' | 'paginated' | 'virtual';

/** Component identities are opaque, unique nonblank strings. Never trim the stored key. */
export function isCollectionKey(key: unknown): key is string {
  return typeof key === 'string' && key.trim().length > 0;
}

/** Resolve the canonical extractor first; retain key as a compatibility option. */
export function collectionGetKey<T>(options: { getKey?: (item: T) => string; key?: (item: T) => string }): (item: T) => string {
  const getKey = options.getKey !== undefined ? options.getKey : options.key;
  if (typeof getKey !== 'function') throw new TypeError('Collections require a getKey function (legacy alias: key).');
  return getKey;
}
