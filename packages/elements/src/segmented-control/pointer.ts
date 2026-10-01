/** Visual viewport rectangles; ties intentionally retain the supplied order. */
export interface PointerRectangle {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Nearest rectangle in two dimensions, independent of text direction and wrapping. */
export function nearestRectangleIndex(x: number, y: number, rectangles: readonly PointerRectangle[]): number | undefined {
  let nearest: number | undefined;
  let shortest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < rectangles.length; index++) {
    const rect = rectangles[index]!;
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    const distance = dx * dx + dy * dy;
    if (distance < shortest) { shortest = distance; nearest = index; }
  }
  return nearest;
}
