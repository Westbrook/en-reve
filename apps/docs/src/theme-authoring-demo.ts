import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/card.js';
import { createReviewDraft, reopenReviewDraft, emitThemeCSS, resolveTheme, valueCSS } from '@en-reve/tokens';
import type { ThemeMode } from '@en-reve/tokens';
import { authoringBaseline } from './theme-authoring-baseline.js';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const style = document.createElement('style');
document.head.append(style);
let mode: ThemeMode = 'light';
let radius: number | undefined = 12;
let geometry = createReviewDraft({ pins: { 'component.button.radius': {value:8,unit:'px'} } });
let rich = createReviewDraft(authoringBaseline);
geometry.setToken('component.control.radius', {value:12,unit:'px'});
const metadata = {title:'Editorial authoring example',rationale:'Preserve custom typography and layered shadows through managed edits.'};

async function render() {
  style.textContent = emitThemeCSS(resolveTheme({mode}), {scope:'root',colorScheme:true})
    + emitThemeCSS(resolveTheme({mode}), {selector:'#css-sample'})
    + emitThemeCSS(geometry.theme, {selector:'#managed-sample'})
    + emitThemeCSS(rich.theme, {selector:'#rich'});
  const cssSample = byId('css-sample');
  cssSample.style.setProperty('--en-button-radius', '8px');
  if (radius === undefined) cssSample.style.removeProperty('--en-control-radius');
  else cssSample.style.setProperty('--en-control-radius', `${radius}px`);
  byId('css-source').textContent = `.sample {\n  --en-control-radius: ${radius === undefined ? 'initial' : `${radius}px`};\n  --en-button-radius: 8px;\n}`;
  byId('managed-source').textContent = `resolveTheme({\n  pins: ${JSON.stringify(geometry.theme.pins,null,2)}\n});`;
  byId('geometry-status').textContent = radius === undefined
    ? 'Shared radius restored: contextual defaults apply; the independent 8px button pin remains.'
    : `Shared radius pinned to ${radius}px; the independent button refinement remains 8px.`;
  const choice = byId<HTMLSelectElement>('shadow-choice');
  const choices = rich.editor('shadow.overlay').choices!;
  choice.replaceChildren(...choices.map((value,index) => {
    const option = new Option(Array.isArray(value) ? `Layered shadow (${value.length} layers)` : `Single-layer shadow ${index + 1}`, String(index));
    option.title = valueCSS('shadow',value); return option;
  }));
  choice.value = String(choices.findIndex(value => JSON.stringify(value) === JSON.stringify(rich.theme.tokens['shadow.overlay'].value)));
  byId('rich-readout').textContent = `${rich.theme.tokens['font.ui.family'].cssValue} · weight ${rich.theme.tokens['font.ui.weight'].cssValue}\n${rich.theme.tokens['shadow.overlay'].cssValue}`;
  byId('baseline-source').textContent = `import { createReviewDraft, reopenReviewDraft } from '@en-reve/tokens';\n\nconst baseline = ${JSON.stringify(authoringBaseline,null,2)};\n\nconst draft = createReviewDraft(baseline);\n// Choices are seeded from the baseline; typed values stay exact.\nconst json = draft.exportJSON(${JSON.stringify(metadata)});\nconst reopened = reopenReviewDraft(json, { baseOptions: baseline });`;
  await Promise.all([...document.querySelectorAll('en-button,en-text-field,en-card')].map(element => (element as HTMLElement & {updateComplete:Promise<boolean>}).updateComplete));
  for (const name of ['css','managed']) {
    const sample = byId(`${name}-sample`);
    const input = sample.querySelector('en-text-field')!.shadowRoot!.querySelector('input')!;
    const button = sample.querySelector('en-button')!.shadowRoot!.querySelector('button')!;
    byId(`${name}-readout`).textContent = `Input ${getComputedStyle(input).borderTopLeftRadius} · Button ${getComputedStyle(button).borderTopLeftRadius}`;
  }
}
byId('apply-radius').addEventListener('click', () => {
  radius = Number(byId<HTMLSelectElement>('shared-radius').value);
  geometry.setToken('component.control.radius',{value:radius,unit:'px'}); void render();
});
byId('restore-radius').addEventListener('click', () => { radius = undefined; geometry.restoreToken('component.control.radius'); void render(); });
byId('appearance').addEventListener('change', () => {
  mode = byId<HTMLSelectElement>('appearance').value as ThemeMode;
  geometry.setContext({mode}); rich.setContext({mode}); void render();
});
byId('apply-shadow').addEventListener('click', () => {
  rich.setToken('shadow.overlay',rich.editor('shadow.overlay').choices![Number(byId<HTMLSelectElement>('shadow-choice').value)]); void render();
});
byId('reset-baseline').addEventListener('click', () => {
  rich = createReviewDraft(authoringBaseline); rich.setContext({mode});
  byId('draft-status').textContent = 'Code-authored baseline restored.'; void render();
});
byId('export-draft').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([rich.exportJSON(metadata)],{type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'theme-authoring-draft.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  byId('draft-status').textContent = 'Typed baseline and edits exported. Separate CSS/Parts treatments are not included.';
});
byId<HTMLInputElement>('reopen-draft').addEventListener('change', async event => {
  const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  try {
    if (file.size > 8 * 1024 * 1024) throw new Error('Draft exceeds the 8 MB limit.');
    const next = reopenReviewDraft(await file.text(),{baseOptions:authoringBaseline});
    rich = next; mode = rich.theme.mode; geometry.setContext({mode}); byId<HTMLSelectElement>('appearance').value = mode;
    await render(); byId('draft-status').textContent = 'Draft reopened: exact font, weight, shadow layers, and accepted edits preserved.';
  } catch (error) { byId('draft-status').textContent = `Draft unchanged. ${error instanceof Error ? error.message : 'Invalid draft.'}`; }
  input.value = '';
});
if (new URL(location.href).searchParams.has('progress-report')) {
  byId('progress-return').hidden = false;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')) {
    const url = new URL(link.href); url.searchParams.set('progress-report',''); link.href = url.href;
  }
}
void render();
