/** Shared radio navigation. Focus/selection and browser event cancellation remain with the adapter. */
export function radioNavigationIndex(key: string, current: number, length: number, rtl: boolean): number | undefined {
  if (length === 0 || current < 0) return undefined;
  let next: number;
  switch (key) {
    case 'ArrowDown': next = current + 1; break;
    case 'ArrowUp': next = current - 1; break;
    case 'ArrowRight': next = current + (rtl ? -1 : 1); break;
    case 'ArrowLeft': next = current + (rtl ? 1 : -1); break;
    case 'Home': next = 0; break;
    case 'End': next = length - 1; break;
    default: return undefined;
  }
  return (next + length) % length;
}
