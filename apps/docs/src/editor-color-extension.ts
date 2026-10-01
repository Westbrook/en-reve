import { html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { parseColor, serializeColor, colorPaint, type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EditorExtension, EditorPickerSession } from '@en-reve/elements/editor-extensions.js';
import type { TokenRun } from '@en-reve/elements/token-editor.js';

export const colorTokenStyles = css`
  en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){
    background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.25rem) * 2) calc(var(--en-color-slider-checker-size,.25rem) * 2);
  }
  en-token-editor::part(color-swatch-paint),en-rich-text-editor::part(color-swatch-paint){display:block;inline-size:100%;block-size:100%;border-radius:inherit}
`;
export const wideColor = 'color(display-p3 1 0.2 0.1 / 0.65)';
/** This application validates color payloads; the shared editor stays domain-independent. */
export function colorTokenRenderer(token: TokenRun): Node {
  const raw = (token.data as {color?: unknown} | undefined)?.color;
  const value = typeof raw === 'string' ? parseColor(raw) : undefined;
  if (!value) return document.createTextNode(token.text);
  const swatch = document.createElement('span');
  const paint = colorPaint(value, CSS.supports('color', 'color(display-p3 1 0 0)'));
  const fill = document.createElement('span');
  fill.part.add('color-swatch-paint');
  fill.style.backgroundColor = paint.fallback;
  fill.style.backgroundColor = paint.value;
  swatch.append(fill);
  swatch.part.add('color-swatch'); swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}
export function commitColorToken(session: EditorPickerSession, raw: string): boolean {
  const parsed = parseColor(raw); if (!parsed) return false;
  const color = serializeColor(parsed);
  return session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id ?? crypto.randomUUID(),type:'demo/color',text:color,label:`Edit color ${color}`,data:{color}}]});
}
/** One application-owned picker session used unchanged by the rich and token editors. */
export const wideColorExtension: EditorExtension = {
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => {
    const existing = (session.token?.data as {color?: unknown} | undefined)?.color;
    const parsed = parseColor(session.query) ?? (typeof existing === 'string' ? parseColor(existing) : undefined) ?? parseColor(wideColor)!;
    return html`${keyed(session.signal, html`<div part="color-session">
      <en-color-picker part="color-picker" exportparts="base:color-base,summary:color-summary,formats:color-formats,channels:color-channels,preview:color-preview,preview-frame:color-preview-frame,space:color-space,gamut-message:color-gamut,conversion:color-conversion,plane:color-plane,plane-thumb:color-plane-thumb,plane-axes:color-plane-axes" label="Editor color" format="rgb" show-hex editable-channels alpha plane data-picker-focus .value=${serializeColor(parsed)} @en-change=${(event: Event) => event.stopPropagation()}></en-color-picker>
      <div part="color-actions"><en-button variant="secondary" @click=${() => session.cancel()}>Cancel</en-button><en-button @click=${(event: Event) => {
        const picker = (event.currentTarget as HTMLElement).closest('[part="color-session"]')!.querySelector<EnColorPicker>('en-color-picker')!;
        if (picker.reportValidity()) commitColorToken(session, picker.value);
      }}>Apply color</en-button></div>
    </div>`)}`;
  },
};
