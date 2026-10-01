import { render } from 'lit';
import { attachAnchorNavigation, type AnchorNavigation } from '@en-reve/primitives/interactions/anchor-navigation.js';
import { navigationTemplate } from './fixture-template.js';

const handles = new Map<string, AnchorNavigation>();
function attach(id: string) {
  const root = document.getElementById(id)!;
  const navigation = root.querySelector<HTMLElement>('.en-section-nav')!;
  const handle = attachAnchorNavigation({ root, navigation });
  handles.set(id, handle);
  handle.followInitialAnchor();
}
for (const root of document.querySelectorAll<HTMLElement>('[data-scope]')) attach(root.id);
// Deliberately cancel at an ancestor after the enhancement's root listener.
document.addEventListener('click', event => {
  const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
  if (link?.hash.endsWith('-cancelled')) event.preventDefault();
});

(window as any).navigationFixture = {
  marker: crypto.randomUUID(),
  refresh(id = 'primary') { handles.get(id)?.refresh(); },
  followInitial(id = 'primary') { handles.get(id)?.followInitialAnchor(); },
  disconnect(id = 'primary') { handles.get(id)?.disconnect(); handles.delete(id); },
  attach,
  replace(id = 'primary') {
    handles.get(id)?.disconnect();
    const root = document.getElementById(id)!;
    const holder = document.createElement('div');
    render(navigationTemplate(id, document.body.dataset.mode!), holder);
    root.querySelector('.en-section-nav')!.replaceWith(holder.querySelector('.en-section-nav')!);
    attach(id);
  },
};
document.body.dataset.ready = 'true';
