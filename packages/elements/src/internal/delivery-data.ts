/** Freeze generated JSON data without evaluating component code. */
export function freezeDeliveryData<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeliveryData(child);
    Object.freeze(value);
  }
  return value;
}
