import {render} from 'lit';
import {hydrate} from '@lit-labs/ssr-client';
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import type {DefinitionLoader} from '@en-reve/elements/lazy-loader.js';
import type {ElementDefinition, ElementRegistry} from '@en-reve/primitives/interactions/registration.js';
import {createSettingsWorkflow, settingsStyles} from './workflows/settings/index.js';
import {essential} from './essential.js';
const params = new URLSearchParams(location.search);
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
async function ready(root: ParentNode) {
  for (let pass=0; pass<4; pass++) {
    const visit = async (node: ParentNode): Promise<void> => {
      for (const el of node.querySelectorAll('*')) {
        await (el as HTMLElement & {updateComplete?: Promise<unknown>}).updateComplete;
        if (el.shadowRoot) await visit(el.shadowRoot);
      }
    };
    await visit(root);
  }
}
export async function start(factory: ((registry: ElementRegistry) => DefinitionLoader) | undefined, optional: readonly ElementDefinition[]) {
  const moduleEvaluated = performance.now();
  const scope = createElementScope({document, registry: params.get('mode') === 'global' ? 'global' : 'auto'});
  const registrationStart = performance.now();scope.register([...essential,...optional]);
  const registrationMs = performance.now()-registrationStart;
  const loader = factory?.(scope.registry);
  let controller: ReturnType<typeof createSettingsWorkflow> | undefined;
  let host: HTMLElement, root: HTMLElement | ShadowRoot;
  let loadMs = 0, defineMs = 0, attempts = 0, disposedUpdates = 0, disposed = false;
  let preloads = 0;
  let updates = 0, releaseLoad: (() => void) | undefined, rerender: (() => void) | undefined;
  const style = document.createElement('style');style.textContent = settingsStyles.cssText;document.head.append(style);
  async function mount() {
    disposed = false;
    host = document.querySelector<HTMLElement>('#ssr-root') ?? scope.createElement('main');
    const ssr = host.id === 'ssr-root';
    if (ssr && host.shadowRoot) scope.initialize(host.shadowRoot);
    root = ssr ? host.shadowRoot! : params.get('root') === 'shadow' ? scope.attachShadow(host) : host;
    if (ssr) {
      const associate = (node: ParentNode) => {for (const element of node.querySelectorAll('*')) if(element.shadowRoot) {
        if ('customElementRegistry' in element.shadowRoot && element.shadowRoot.customElementRegistry === null) scope.initialize(element.shadowRoot);
        associate(element.shadowRoot);
      }};
      associate(root);
    }
    if (root instanceof ShadowRoot) {const sheet = new CSSStyleSheet();sheet.replaceSync(settingsStyles.cssText);root.adoptedStyleSheets=[sheet];}
    let queued = false;
    const requestUpdate = () => {if(disposed){disposedUpdates++;return;}updates++;if(!queued){queued=true;queueMicrotask(()=>{queued=false;if(!disposed&&controller)render(controller.render(),root,{creationScope:scope.creationScope});});}};
    rerender = requestUpdate;
    controller = createSettingsWorkflow({requestUpdate, preparePalette: loader ? async options => {
      attempts++;
      if (params.has('manual-hold')) await new Promise<void>(resolve => {releaseLoad = resolve;});
      if (params.has('hold')) await new Promise(resolve=>setTimeout(resolve,300));
      if (params.has('fail') && attempts===1) throw Error('Fixture transport failure');
      let time = performance.now();await loader.load(['en-command-palette'],options);loadMs+=performance.now()-time;
      time = performance.now();await loader.ensure(['en-command-palette'],options);defineMs+=performance.now()-time;
    } : undefined, preloadPalette: loader && params.has('intent') ? async options => {
      preloads++;
      if (params.has('fail-intent')) throw Error('Intent preparation failure');
      await loader.load(['en-command-palette'], options);
    } : undefined});
    document.body.append(host);
    if (ssr) hydrate(controller.render(),root,{creationScope:scope.creationScope});
    else render(controller.render(),root,{creationScope:scope.creationScope});
    await ready(root);await frame();
  }
  await mount();
  // Both diagnostic UI and automation release the same existing held request.
  // Clearing before resolution makes repeated activation a no-op.
  const releaseHeldLoad = () => {
    const release = releaseLoad;
    releaseLoad = undefined;
    release?.();
    return Boolean(release);
  };
  if (loader && params.has('manual-hold') && params.has('human-review')) {
    const controls = document.createElement('section');
    controls.dataset.humanReview = 'command';
    controls.setAttribute('aria-label', 'Command loading companion diagnostic');
    controls.innerHTML = `<h2>Command loading companion diagnostic</h2>
      <p>Activate Search commands to observe its loading feedback, then keyboard-focus and activate Release held command load. This new focus choice keeps the palette closed; activate Search commands again after loading clears. This diagnostic is separate from production-route review.</p>
      <button type="button">Release held command load</button>
      <p data-release-state>Command loading is held only after Search commands is activated.</p>`;
    const state = controls.querySelector<HTMLElement>('[data-release-state]')!;
    controls.querySelector('button')!.addEventListener('click', () => {
      state.textContent = releaseHeldLoad()
        ? 'The hold is released. Wait for the existing loading feedback to clear before activating Search commands again.'
        : 'No command load is currently held.';
    });
    if (params.has('progress-report')) {
      const link = document.createElement('a');
      link.href = 'http://127.0.0.1:4177'; link.textContent = 'Progress Report'; controls.append(link);
    }
    // Keep controls outside the controller's render/hydration ownership.
    document.body.append(controls);
  }
  const startup = {moduleEvaluatedMs:moduleEvaluated, registrationMs, readyMs:performance.now(), mode:scope.mode, native:elementScopeCapabilities(document).native, paletteDefined:!!scope.get('en-command-palette')};
  Object.assign(window, {fixture: {
    startup, scope, loader, get root(){return root;}, get attempts(){return attempts;},
    get palette(){return root.querySelector('en-command-palette');},
    async open(){
      const start=performance.now();
      (root.querySelector('#settings-command-trigger') as HTMLElement).click();
      const deadline=start+10000;
      while (!(root.querySelector('en-command-palette') as any)?.open) {if(performance.now()>deadline)throw Error('Palette did not open');await frame();}
      await ready(root);await frame();
      return {firstUseMs:performance.now()-start,loadMs,defineMs};
    },
    async cycle(){
      await this.open();
      this.dispose();await frame();await mount();
    },
    dispose(){controller?.dispose();controller=undefined;disposed=true;render(null,root);host.remove();},
    reset(){controller?.reset();},
    releaseLoad: releaseHeldLoad,
    rerender(){rerender?.();},
    state(){return {disposedUpdates,connected:host.isConnected,attempts,updates,preloads};},
  }});
}
