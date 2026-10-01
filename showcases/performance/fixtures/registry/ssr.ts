import '@en-reve/ssr/install.js';
import {renderToString} from '@en-reve/ssr';
import {registerAll} from '@en-reve/elements/catalog.js';
const workflows = {settings: () => import('./workflows/settings.js'), sso: () => import('./workflows/sso.js'), chat: () => import('./workflows/chat.js')};
registerAll();
export async function renderWorkflow(workflow: keyof typeof workflows, count: number, scoped: boolean) {
  const module = await workflows[workflow]();
  if ('extraDefinitions' in module) for (const definition of module.extraDefinitions) {
    if (!customElements.get(definition.tagName)) customElements.define(definition.tagName, definition.elementClass);
  }
  const controller = module.create({requestUpdate() {}});
  let markup: string;
  try {markup = await renderToString(controller.render());}
  finally {controller.dispose();}
  // Only fixture-owned generated DSD is transformed. Lit markers and node order
  // stay byte-identical; ordinary server light DOM is never claimed rebindable.
  if (scoped) markup = markup.replaceAll('shadowrootmode="open"', 'shadowrootmode="open" shadowrootcustomelementregistry');
  return Array.from({length: count}, (_, id) => `<section data-island="${id}" data-ssr><template shadowrootmode="open"${scoped ? ' shadowrootcustomelementregistry' : ''}><style>${module.styles.cssText}</style><div data-render>${markup}</div></template></section>`).join('');
}
