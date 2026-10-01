import {css, html, nothing} from 'lit';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { feedbackStyles } from '@en-reve/styles/feedback.js';
import { progressBarTemplate } from './template.js';

/**
 * Native task progress; omitting value produces indeterminate progress.
 * Provide a localized label naming the task. Progress updates do not create a live region.
 * @csspart circle - Decorative circular visual surrounding the accessible native progress element.
 * @tagname en-progress-bar
 * @cssprop --en-progress-color - Completed progress color.
 * @cssprop --en-progress-track-color - Progress track color.
 * @cssprop --en-progress-size - Progress track thickness.
 * @csspart track - The native progress surface.
 */
export class EnProgressBar extends EnElement {
  static override properties = {
    value: { type: Number },
    shape: { reflect: true },
    max: { type: Number },
    label: { type: String },
  };
  static override styles = [foundationStyles, blockHostStyles, feedbackStyles, css`
    .circle { display:inline-grid; place-items:center; inline-size:var(--en-size-control-min); block-size:var(--en-size-control-min); position:relative; color:var(--en-progress-color,var(--en-color-action)); }
    .circle progress { position:absolute; inline-size:1px; block-size:1px; clip-path:inset(50%); overflow:hidden; }
    svg { inline-size:100%; block-size:100%; rotate:-90deg; }
    circle { fill:none; stroke-width:4; }
    .track { stroke:var(--en-progress-track-color,var(--en-color-boundary)); }
    .value { stroke:currentColor; stroke-linecap:round; }
    .indeterminate { animation:progress-turn 1s linear infinite; }
    @keyframes progress-turn { to { transform:rotate(360deg); } }
    @media(prefers-reduced-motion:reduce) { .indeterminate { animation:none; } }
    @media(forced-colors:active) { .track { stroke:CanvasText; } .value { stroke:Highlight; } }
  `];

  /** Linear bar or determinate/indeterminate circular presentation. */
  declare shape: 'bar' | 'circle';
  /** Completed work. Undefined indicates an indeterminate task. */
  declare value: number | undefined;
  /** Total work; nonpositive or nonfinite values normalize to 100. */
  declare max: number;
  /** Localized accessible task name. */
  declare label: string;

  constructor() {
    super();
    this.value = undefined; this.shape = 'bar';
    this.max = 100;
    this.label = '';
  }

  protected override render() {
    const max = Number.isFinite(this.max) && this.max > 0 ? this.max : 100;
    const value = this.value === undefined || !Number.isFinite(this.value)
      ? undefined
      : Math.max(0, Math.min(max, this.value));
    const progress = progressBarTemplate({ value, max, label: this.label });
    if (this.shape !== 'circle') return progress;
    return html`<span class="circle" part="circle">${progress}<svg viewBox="0 0 40 40" aria-hidden="true" class=${value === undefined ? 'indeterminate' : nothing}><circle class="track" cx="20" cy="20" r="16"></circle><circle class="value" cx="20" cy="20" r="16" pathLength="100" stroke-dasharray=${`${value === undefined ? 25 : value / max * 100} 100`}></circle></svg></span>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-progress-bar': EnProgressBar; } }
