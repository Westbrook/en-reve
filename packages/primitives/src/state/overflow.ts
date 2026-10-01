/** Largest prefix that fits, reserving the disclosure only when needed. */
export function visibleActionCount(widths: readonly number[], available: number, disclosure: number, gap = 0): number {
    const sum = widths.reduce((n, w) => n + Math.max(0, w), 0) + Math.max(0, widths.length - 1) * gap;
    if (sum <= available)
        return widths.length;
    let used = Math.max(0, disclosure), count = 0;
    for (const width of widths) {
        const next = used + Math.max(0, width) + gap;
        if (next > available)
            break;
        used = next;
        count++;
    }
    return count;
}
