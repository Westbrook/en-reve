import '@en-reve/elements/define/button.js';
import type { EnButton } from '@en-reve/elements/button.js';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';
const appearance = document.querySelector<HTMLSelectElement>('#appearance')!;
const variant = document.querySelector<HTMLSelectElement>('#variant')!;
const disabled = document.querySelector<HTMLInputElement>('#disabled')!;
const buttons = Array.from(document.querySelectorAll<EnButton>('en-button'));
const theme = document.createElement('style');
document.head.append(theme);
appearance.value = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
function update() {
  theme.textContent = emitThemeCSS(resolveTheme({mode:appearance.value === 'dark' ? 'dark' : 'light'}), {scope:'root',colorScheme:true});
  for (const button of buttons) { button.variant = variant.value as EnButton['variant']; button.disabled = disabled.checked; }
}
for (const control of [appearance,variant,disabled]) control.addEventListener('change',update);
for (const button of buttons) button.addEventListener('click',()=>{
  document.querySelector('#activation')!.textContent = button.id === 'before' ? 'Existing broad-paint button activated.' : 'Refined button activated.';
});
update();
if (new URLSearchParams(location.search).has('progress-report')) {
  document.querySelector<HTMLElement>('#progress-return')!.hidden = false;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')) {
    const url = new URL(link.href); url.searchParams.set('progress-report',''); link.href=url.href;
  }
}
