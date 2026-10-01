/** Internal SSR metadata. Callers continue to author ordinary named-slot children. */
export const OPTIONAL_SLOT_PRESENCE_ATTRIBUTE = 'data-en-optional-slots';

export interface OptionalSlotPresence {
  readonly version: 1;
  readonly slots: Readonly<Record<string, boolean>>;
}

/**
 * Recover before the first client render; remove after that render succeeds.
 * Keeping the exact server baseline until firstUpdated also permits authored
 * children to change before hydration without corrupting Lit's committed values.
 */
export function recoverOptionalSlotPresence(
  host: Element,
  names: readonly string[],
): Readonly<Record<string, boolean>> | undefined {
  const serialized = host.getAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE);
  if (serialized === null) return undefined;
  let plan: unknown;
  try { plan = JSON.parse(serialized); }
  catch { throw new TypeError('Invalid optional-slot SSR metadata.'); }
  if (!plan || typeof plan !== 'object') throw new TypeError('Invalid optional-slot SSR metadata.');
  const candidate = plan as Partial<OptionalSlotPresence>;
  if (candidate.version !== 1 || !candidate.slots || typeof candidate.slots !== 'object'
    || Array.isArray(candidate.slots) || Object.keys(candidate.slots).length !== names.length
    || names.some(name => typeof candidate.slots?.[name] !== 'boolean')) {
    throw new TypeError('Invalid optional-slot SSR metadata.');
  }
  return Object.freeze(Object.fromEntries(names.map(name => [name, candidate.slots![name]])));
}
