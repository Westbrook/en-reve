import { html, svg, type TemplateResult } from 'lit';
export interface ChartDatum {
    readonly key: string;
    readonly label: string;
    readonly value: number;
}
export interface ChartModel {
    readonly data: readonly ChartDatum[];
    readonly min: number;
    readonly max: number;
    readonly colors: readonly string[];
    readonly foreground: string;
    readonly boundary: string;
}
/** A renderer returns decorative visual markup; the owner supplies accessible data
 * and legend controls. CSS color expressions keep SVG responsive to theme changes. */
export type ChartRenderer = (model: ChartModel) => TemplateResult;
export function chartModel(data: readonly ChartDatum[]): ChartModel { const finite = data.filter(d => Number.isFinite(d.value)); return { data: finite, min: Math.min(0, ...finite.map(d => d.value)), max: Math.max(1, ...finite.map(d => d.value)), colors: ['var(--en-color-action)', 'var(--en-color-success)', 'var(--en-color-warning)', 'var(--en-color-danger)'], foreground: 'var(--en-color-text)', boundary: 'var(--en-color-boundary)' }; }
/** Small renderer-neutral SVG reference adapter. Negative bars share a zero line. */
export const barChart: ChartRenderer = (model) => { const width = 600, height = 220, pad = 24; const y = (n: number) => height - pad - (n - model.min) / (model.max - model.min) * (height - pad * 2); const column = (width - pad * 2) / Math.max(1, model.data.length); return html `<svg viewBox="0 0 600 220" width="100%" aria-hidden="true" focusable="false"><line x1=${pad} x2=${width - pad} y1=${y(0)} y2=${y(0)} stroke=${model.boundary}></line>${model.data.map((d, i) => svg `<rect x=${pad + i * column + column * .15} y=${Math.min(y(d.value), y(0))} width=${column * .7} height=${Math.max(1, Math.abs(y(d.value) - y(0)))} fill=${model.colors[i % model.colors.length]}></rect>`)}</svg>`; };
