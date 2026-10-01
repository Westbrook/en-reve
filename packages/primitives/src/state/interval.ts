export type Interval = readonly [
    number,
    number
];
export interface IntervalLimits {
    min: number;
    max: number;
    step: number;
    minGap: number;
}
export function intervalLimits(input: Partial<IntervalLimits>): IntervalLimits {
    const min = Number.isFinite(input.min) ? input.min! : 0;
    const requestedMax = Number.isFinite(input.max) ? Math.max(min, input.max!) : Math.max(min, 100);
    const step = Number.isFinite(input.step) && input.step! > 0 ? input.step! : 1;
    const max = Number((min + Math.floor((requestedMax - min) / step + 1e-10) * step).toPrecision(12));
    const minGap = Number(Math.min(max - min, Math.max(0, Math.ceil((Number.isFinite(input.minGap) ? input.minGap! : 0) / step) * step)).toPrecision(12));
    return { min, max, step, minGap };
}
export function snapIntervalNumber(value: number, limits: IntervalLimits): number {
    const n = Number.isFinite(value) ? value : limits.min;
    return Math.max(limits.min, Math.min(limits.max, Number((limits.min + Math.round((n - limits.min) / limits.step) * limits.step).toPrecision(12))));
}
export function normalizeInterval(value: readonly number[], limits: IntervalLimits): Interval {
    const lower = snapIntervalNumber(value[0] ?? limits.min, limits);
    const upper = snapIntervalNumber(value[1] ?? limits.max, limits);
    const low = Math.min(lower, upper, limits.max - limits.minGap);
    return [low, Math.max(upper, lower, low + limits.minGap)];
}
export function moveInterval(value: Interval, thumb: 0 | 1, proposed: number, limits: IntervalLimits): Interval {
    const next = snapIntervalNumber(proposed, limits);
    return thumb === 0 ? [Math.min(next, value[1] - limits.minGap), value[1]] : [value[0], Math.max(next, value[0] + limits.minGap)];
}
