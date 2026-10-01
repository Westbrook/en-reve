import { LitElement, html, css, unsafeCSS } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { repeat } from 'lit/directives/repeat.js';
import source from './source.generated.mjs';

const unit = css`var(${unsafeCSS('--fixture-unit')}, ${unsafeCSS('8px')})`;
const inset = css`max(0px, ${unit} - ${css`2px`})`;
const automatic = css`auto`;
const border = css`border: 3px solid rgb(12, 34, 56);`;
export const fixtureStyles = css`
  html { color-scheme: light dark; }
  body { margin: 16px; font: 16px/1.5 sans-serif; }
  #styles { container: minifier / inline-size; inline-size: 320px; }
  .style-parent { --fixture-unit: 12px; }
  .style-parent:has(input:checked) { --fixture-unit: 16px; }
  .style-parent {
    & :is(.measured, .unused) {
      box-sizing: content-box;
      inline-size: calc(100px + ${unit});
      padding-inline: ${inset};
      color: light-dark(rgb(17, 34, 51), rgb(221, 238, 255));
    }
  }
  @container minifier (inline-size > 200px) {
    .measured { ${border} }
  }
  #modern-select { appearance: ${automatic}; }
  @supports (appearance: base-select) {
    #modern-select, #modern-select::picker(select) { appearance: base-select; }
  }
  .preserved-parent { white-space: pre-wrap; }
  .preserved-parent > div { font-family: monospace; }
  .inline-element { display: inline; }
  pre { overflow: auto; max-inline-size: 100%; }
  en-text-field, en-textarea { display: block; max-inline-size: 30rem; }
`;

export class MinifierProbe extends LitElement {
  static properties = { payload: { attribute: false } };
  static styles = css`
    :host { display: block; --probe-gap: 7px; }
    span { padding-inline-start: var(--probe-gap, 3px); }
    ::slotted(b) { color: rgb(9, 87, 65); }
  `;
  constructor() { super(); this.payload = { id: 'server' }; }
  render() { return html`<span>${this.payload.id}</span><slot></slot>`; }
}

export const initial = () => ({
  title: 'Server title', notes: '\nFirst line\nA second line & details',
  items: [{ id: 'alpha', label: 'Alpha' }, { id: 'beta', label: 'Beta' }],
  quote: 'two "quotes" & one \'apostrophe\'', selected: 'none', gap: 8, disabled: false,
});

// Inherited white-space cannot be inferred by an HTML-only minifier.
function preservedText() {
  return /* en-preserve-whitespace */ html`<div class="preserved-parent"><div id="preserved-text">first  second
	third   fourth</div></div>`;
}
function sourceTemplate() {
  const escaped = source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return staticHtml`<code class="language-javascript">${unsafeStatic(escaped)}</code>`;
}

export function template(state = initial(), actions = {}) {
	return html`<en-rich-text-editor id="minified-rich" label="Rich description"></en-rich-text-editor><en-token-editor id="minified-token" label="Token description"></en-token-editor><form id="draft-form">
		<en-text-field label="Draft title" name="title" value=${state.title}></en-text-field>
		<en-textarea label="Draft notes" name="notes" value=${state.notes}></en-textarea>
	</form>
	<section aria-label="Binding offsets">
		${repeat(state.items, item => item.id, item => html`
			<button type="button" data-key=${item.id} title="${state.quote} / ${item.id}"
				data-single='${item.label} & ${state.quote}' ?disabled=${item.id === 'alpha' && state.disabled}
				@click=${() => actions.choose?.(item.id)}>Choose ${item.label}</button>
		`)}
		<button type="button" @click=${actions.advance}>Advance fixture</button>
		<output id="selected">${state.selected}</output>
		<en-minifier-probe .payload=${{ id: state.items[0].id }}><b>Slotted text</b></en-minifier-probe>
		<input id="slash-guard" aria-label="Slash guard" value=path/>
		<div id="dynamic-style" style="--dynamic-gap: ${state.gap}px; inline-size: calc(40px + ${state.gap}px)"></div>
	</section>
	<section id="styles" aria-label="Computed style fragments">
		<div class="style-parent"><label><input type="checkbox" checked>Large CSS unit</label><div class="measured">Measured text</div></div>
		<label>Modern select<select id="modern-select"><option>First</option><option>Second</option></select></label>
	</section>
	<p id="inline-words">Before <en-inline-word class="inline-element">middle</en-inline-word> after ${state.items[0].label} done.</p>
	${preservedText()}
	<pre id="literal-code"><code>first  second
	third &lt;tag&gt;</code></pre>
	<label>Literal notes<textarea id="literal-notes">

first
	second</textarea></label>
	<details id="source"><summary>View fixture source</summary><pre>${sourceTemplate()}</pre></details>`;
}
