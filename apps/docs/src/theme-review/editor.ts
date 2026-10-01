import { afterAcceptedChange } from '../change-consumption.js';
import { html, nothing, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import {
  colorFromHex, stableStringify, valueCSS, styleCustomizationContracts,
  type ColorValue, type DurationValue, type EditorDescriptor, type ResolvedToken,
} from '@en-reve/tokens';

export interface ManagedTokenEditorOptions {
  token: ResolvedToken;
  /** Stable, model-owned policy for the draft's baseline context. */
  descriptor: EditorDescriptor;
  pin?: unknown;
  error?: string;
  onApply(value: unknown): void | Promise<void>;
  onRestore(): void;
  canRestore?: boolean;
  idPrefix?: string;
  /** Change only for an explicit input reset; the form and action focus stay stable. */
  resetRevision?: number;
}

interface ValueField extends HTMLElement {
  value: string;
  error: string;
  reportValidity(): boolean;
}

type SelectItem = { value: string; label: string; disabled?: boolean };
const channels = ['Red', 'Green', 'Blue'] as const;
const pointLabels = ['First control point X', 'First control point Y', 'Second control point X', 'Second control point Y'];

function field(form: HTMLFormElement, key: string): ValueField {
  const control = form.querySelector<ValueField>(`[data-token-input="${key}"]`);
  if (!control) throw new Error('This editor is not ready. Try again after its controls load.');
  return control;
}

function containingForm(event: Event): HTMLFormElement {
  const form = (event.currentTarget as HTMLElement).closest('form');
  if (!form) throw new Error('The token editor form is missing.');
  return form;
}

function clearFieldError(event: Event): void {
  (event.currentTarget as ValueField).error = '';
}

function numberField(key: string, label: string, value: number, min: number, max: number, step: number, description = ''): TemplateResult {
  return html`<en-number-field data-token-input=${key} name=${key}
    .label=${label} .description=${description} .value=${String(value)}
    .min=${min} .max=${max} .step=${step} required
    @en-input=${clearFieldError}></en-number-field>`;
}

function numericValue(form: HTMLFormElement, key: string, initial: number, min: number, max: number, step: number): number {
  const control = field(form, key);
  const raw = control.value;
  // An exact source value outside the managed interval is preservation-only.
  if (raw === String(initial)) return initial;
  const value = raw.trim() === '' ? NaN : Number(raw);
  const steps = (value - min) / step;
  if (!Number.isFinite(value) || value < min || value > max || Math.abs(steps - Math.round(steps)) > 1e-7) {
    const message = `Choose a value from ${min} to ${max} in steps of ${step}.`;
    control.error = message;
    control.reportValidity();
    control.focus();
    throw new Error(message);
  }
  control.error = '';
  return value;
}

function colorHex(color: ColorValue): string {
  return `#${color.components.map(component => Math.round(component * 255).toString(16).padStart(2, '0')).join('')}`;
}

function updateChannels(event: Event): void {
  afterAcceptedChange(event, (control: ValueField) => control.value, (value, control) => {
    const form = control.closest('form');
    if (!form) return;
    const color = colorFromHex(value);
    color.components.forEach((component, index) => { field(form, `channel-${index}`).value = String(Math.round(component * 255)); });
  });
}

function updatePicker(event: Event): void {
  afterAcceptedChange(event, (control: ValueField) => control.value, (_value, control) => {
    control.error = '';
    const form = control.closest('form');
    if (!form) return;
    const values = channels.map((_, index) => {
      const raw = field(form, `channel-${index}`).value;
      return raw.trim() === '' ? NaN : Number(raw);
    });
    if (values.every(value => Number.isFinite(value) && value >= 0 && value <= 255)) {
      field(form, 'color').value = colorHex({colorSpace:'srgb', components:values.map(value => value / 255) as unknown as ColorValue['components']});
    }
  });
}

function sourceAlias(options: ManagedTokenEditorOptions): string | undefined {
  if (typeof options.pin === 'string' && options.pin.startsWith('{') && options.pin.endsWith('}')) return options.pin.slice(1, -1);
  return options.token.provenance === 'alias' ? options.token.dependencies[0] : undefined;
}

function valueChoices(options: ManagedTokenEditorOptions): {items: SelectItem[]; selected: string} {
  const {token, descriptor} = options;
  const choices = descriptor.choices ?? [];
  const index = choices.findIndex(value => stableStringify(value) === stableStringify(token.value));
  const items = choices.map((value, index) => ({value:String(index), label:valueCSS(token.type, value)}));
  if (index === -1) items.unshift({value:'current', label:`Current value: ${token.cssValue}`});
  return {items, selected:index === -1 ? 'current' : String(index)};
}

function literalEditor(options: ManagedTokenEditorOptions): TemplateResult {
  const {token, descriptor} = options;
  switch (descriptor.kind) {
    case 'color': {
      const value = token.value as ColorValue;
      return html`
        <en-color-field data-token-input="color" name="color" label="Color"
          description="sRGB color picker. Changes stay in this editor until Apply pin."
          .value=${colorHex(value)} @en-change=${updateChannels}></en-color-field>
        <div class="theme-editor-channels">
          ${channels.map((label, index) => html`<en-number-field data-token-input=${`channel-${index}`} name=${`channel-${index}`}
            .label=${`${label} channel`} description="0–255" .value=${String(Math.round(value.components[index] * 255))}
            .min=${0} .max=${255} .step=${1} required
            @en-input=${clearFieldError} @en-change=${updatePicker}></en-number-field>`)}
          ${descriptor.alpha ? numberField('alpha', 'Opacity', value.alpha ?? 1, 0, 1, 0.01, '0 is transparent; 1 is opaque.') : nothing}
        </div>
        <p class="theme-editor-help">The picker and channel previews use 8-bit sRGB. Unchanged channels retain their exact source values, shown below.</p>
      `;
    }
    case 'duration': {
      const value = token.value as DurationValue;
      return numberField('duration', 'Duration (ms)', value.value * (value.unit === 's' ? 1000 : 1), descriptor.min ?? 0, descriptor.max ?? 500, descriptor.step ?? 20);
    }
    case 'bezier': return html`<div class="theme-editor-coordinates">${pointLabels.map((label, index) => numberField(`point-${index}`, label, (token.value as number[])[index], descriptor.min ?? 0, descriptor.max ?? 1, 0.01))}</div>`;
    case 'dimension':
    case 'number':
    case 'font-family':
    case 'font-style':
    case 'font-weight':
    case 'shadow': {
      const {items, selected} = valueChoices(options);
      return html`<en-select data-token-input="choice" name="choice" label="Managed value"
        description="Choices stay anchored to this draft's starting context. The exact current value is preserved when it is outside those choices."
        .items=${items} .value=${selected}></en-select>`;
    }
  }
}

function readLiteral(form: HTMLFormElement, options: ManagedTokenEditorOptions): unknown {
  const {token, descriptor} = options;
  switch (descriptor.kind) {
    case 'color': {
      const current = token.value as ColorValue;
      const components = channels.map((_, index) => {
        const initial = Math.round(current.components[index] * 255);
        const value = numericValue(form, `channel-${index}`, initial, 0, 255, 1);
        return value === initial ? current.components[index] : value / 255;
      }) as unknown as ColorValue['components'];
      const unchanged = components.every((component, index) => component === current.components[index]);
      const alpha = descriptor.alpha ? numericValue(form, 'alpha', current.alpha ?? 1, 0, 1, 0.01) : unchanged ? current.alpha : undefined;
      if (unchanged && (alpha ?? 1) === (current.alpha ?? 1)) return current;
      return {colorSpace:'srgb', components, ...(alpha === undefined ? {} : {alpha})};
    }
    case 'duration': {
      const current = token.value as DurationValue;
      const initial = current.value * (current.unit === 's' ? 1000 : 1);
      const value = numericValue(form, 'duration', initial, descriptor.min ?? 0, descriptor.max ?? 500, descriptor.step ?? 20);
      return value === initial ? current : {value, unit:'ms'};
    }
    case 'bezier': return pointLabels.map((_, index) => numericValue(form, `point-${index}`, (token.value as number[])[index], descriptor.min ?? 0, descriptor.max ?? 1, 0.01));
    default: {
      const choice = field(form, 'choice').value;
      if (choice === 'current') return token.value;
      const index = Number(choice);
      const choices = descriptor.choices ?? [];
      if (!/^\d+$/.test(choice) || !Number.isInteger(index) || index >= choices.length) throw new Error('Choose one of the managed values.');
      return choices[index];
    }
  }
}

function selectSource(event: Event): void {
  afterAcceptedChange(event, (control: ValueField) => control.value, (value, control) => {
    const literal = control.closest('form')?.querySelector<HTMLFieldSetElement>('[data-literal-fields]');
    if (literal) literal.disabled = value !== 'literal';
  });
}

/** Only input drafts live in the controls; accepted theme state and policy belong to the caller. */
export function managedTokenEditorTemplate(options: ManagedTokenEditorOptions): TemplateResult {
  const {token, descriptor, pin, error, canRestore = false, onRestore, idPrefix = 'theme-token', resetRevision = 0} = options;
  const contract = styleCustomizationContracts.find(item => item.cssName === token.cssName);
  const alias = sourceAlias(options);
  const sourceItems: SelectItem[] = [
    {value:'literal', label:'Managed value'},
    ...descriptor.aliasTargets.map(target => ({value:target, label:target})),
  ];
  if (alias && !descriptor.aliasTargets.includes(alias)) sourceItems.push({value:alias, label:`Current reference: ${alias}`});
  const helpId = `${idPrefix}-${token.id}-help`;
  const errorId = `${idPrefix}-${token.id}-error`;
  const apply = async (form: HTMLFormElement) => {
    const errorNode = form.querySelector<HTMLElement>('[data-editor-error]');
    if (errorNode) { errorNode.textContent = ''; errorNode.hidden = true; }
    try {
      const source = field(form, 'source').value;
      if (source !== 'literal' && !sourceItems.some(item => item.value === source)) throw new Error('Choose a compatible token reference.');
      const value = source === 'literal' ? readLiteral(form, options) : `{${source}}`;
      await options.onApply(value);
    } catch (cause) {
      if (errorNode) {
        errorNode.textContent = cause instanceof Error ? cause.message : 'This value could not be applied. Review the editor controls.';
        errorNode.hidden = false;
      }
    }
  };
  return html`${keyed(`${idPrefix}:${token.id}`, html`
    <form class="theme-token-editor" aria-label="Token editor" novalidate
      @submit=${(event: SubmitEvent) => { event.preventDefault(); void apply(event.currentTarget as HTMLFormElement); }}>
      <header class="theme-editor-heading">
        <h2 class="en-heading-small">${token.id}</h2>
        <p id=${helpId}>${token.description || 'Edit this design rule using its managed values or a compatible token reference.'}</p>
      </header>
      ${keyed(resetRevision, html`
        <en-select data-token-input="source" name="source" label="Value source"
          description="A token reference follows that rule. A managed value creates an independent pin."
          .items=${sourceItems} .value=${alias ?? 'literal'} @en-change=${selectSource}></en-select>
        <fieldset class="theme-editor-values" data-literal-fields ?disabled=${alias !== undefined}>
          <legend>Managed value</legend>
          ${literalEditor(options)}
        </fieldset>
      `)}
      <div class="theme-editor-actions">
        <en-button @click=${(event: Event) => void apply(containingForm(event))}>Apply pin</en-button>
        <en-button variant="secondary" ?disabled=${!canRestore} @click=${onRestore}>Restore default rule</en-button>
      </div>
      <p class="theme-editor-help">Apply pins this rule in the local draft. Other unpinned rules can still follow it. Restore removes this rule's customization and resumes its default relationship.</p>
      <p class="theme-editor-help">The managed choices are a subset of typed compiler values. Custom font stacks and layered shadows can be seeded in code; gradients and responsive CSS remain available through CSS and Parts. <a href=${typeof location !== 'undefined' && new URL(location.href).searchParams.has('progress-report') ? '/theme-authoring.html?progress-report' : '/theme-authoring.html'}>Explore authoring routes</a>.</p>
      ${token.id.startsWith('component.') && token.provenance === 'alias' ? html`<p class="theme-editor-help">This optional hook is unset in full-theme CSS. Its authoring default below is a suggested pin, not a measurement of the component. Actual styling follows the family and size fallbacks until you apply a pin.</p>` : nothing}
      <p id=${errorId} class="theme-editor-error" data-editor-error role="alert" ?hidden=${!error}>${error ?? ''}</p>
      <dl class="theme-editor-current">
        <dt>${token.id.startsWith('component.') && token.provenance === 'alias' ? 'Authoring default (unpinned)' : 'Resolved token value'}</dt><dd><code>${token.cssValue}</code></dd>
        <dt>CSS property</dt><dd><code>${token.cssName}</code></dd>
        <dt>Value origin</dt><dd>${token.provenance}</dd>
      </dl>
      <details class="theme-editor-impact">
        <summary>Where this rule applies</summary>
        <p>${contract ? 'Registered family override; manageable here because this theme supplies a typed token.' : token.id.startsWith('component.') ? 'Application-owned output: no registered library consumer. Verify its spelling and stylesheet reader.' : 'Semantic token: component effects follow graph dependencies and contextual fallbacks.'}</p>
        ${contract ? html`<dl><dt>Family / states</dt><dd>${contract.family} · ${contract.states.join(', ') || 'contextual'}</dd><dt>Fallback</dt><dd>${contract.fallback.description} ${[...contract.fallback.cssNames,...contract.fallback.tokenIds].join(', ')}</dd><dt>Size</dt><dd>${contract.size.description}</dd><dt>Source consumers</dt><dd>${contract.consumers.join(', ')}</dd></dl><p>Source references do not prove every nested Part is reachable. Consult the component Parts contract and rendered checks for the exact composition.</p>` : nothing}
      </details>
      <details class="theme-editor-source">
        <summary>Exact current value${pin === undefined ? '' : ' and pin'}</summary>
        <pre>${JSON.stringify(token.value, null, 2)}</pre>
        ${pin === undefined ? nothing : html`<h3>Pin</h3><pre>${JSON.stringify(pin, null, 2)}</pre>`}
      </details>
    </form>
  `)}`;
}
