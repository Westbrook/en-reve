import {test, expect} from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.goto('/probes/scoped-registry/');
  await page.waitForFunction(() => Boolean((window as any).scopeTest));
});

test('eager scopes construct nested components in ordinary and shadow trees', async ({page, browserName}) => {
  const result = await page.evaluate(async () => {
    const {createElementScope, elementScopeCapabilities, datePickerDefinition, splitViewDefinition, html, render} = (window as any).scopeTest;
    const scope = createElementScope({document});
    scope.register([datePickerDefinition, splitViewDefinition]);
    scope.register([datePickerDefinition]);
    const checks = [];
    for (const shadow of [false, true]) {
      const host = scope.createElement('section'); document.body.append(host);
      const root = shadow ? scope.attachShadow(host) : host;
      render(html`<en-date-picker></en-date-picker><en-split-view><div slot="primary">Primary</div><div slot="secondary">Secondary</div></en-split-view>`, root, {creationScope: scope.creationScope});
      const picker = root.querySelector('en-date-picker'), split = root.querySelector('en-split-view');
      await Promise.all([picker.updateComplete, split.updateComplete]);
      const calendar = picker.shadowRoot.querySelector('en-calendar'), splitter = split.shadowRoot.querySelector('en-splitter');
      await Promise.all([calendar.updateComplete, splitter.updateComplete]);
      checks.push({picker: picker instanceof datePickerDefinition.elementClass, calendar: calendar instanceof scope.get('en-calendar'), splitter: splitter instanceof scope.get('en-splitter'), styles: picker.shadowRoot.adoptedStyleSheets.length > 0 || !!picker.shadowRoot.querySelector('style'), nested: !elementScopeCapabilities(document).native || [picker, calendar, split, splitter].every(el => el.customElementRegistry === scope.registry && el.shadowRoot.customElementRegistry === scope.registry)});
    }
    return {mode: scope.mode, checks, global: !!customElements.get('en-date-picker'), cached: elementScopeCapabilities(document) === elementScopeCapabilities(document)};
  });
  expect(result.mode).toBe(browserName === 'firefox' ? 'global' : 'scoped');
  expect(result.global).toBe(browserName === 'firefox');
  expect(result.cached).toBe(true);
  expect(result.checks).toEqual(Array(2).fill({picker:true, calendar:true, splitter:true, styles:true, nested:true}));
});

test('same-tag versions and subclass definitions remain isolated', async ({page}) => {
  const result = await page.evaluate(async () => {
    const {createElementScope, EnElement, html, elementScopeCapabilities} = (window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const results = [];
    class Parent extends EnElement {render() {return html`<scope-child></scope-child>`;}}
    for (const version of ['one', 'two']) {
      const scope = createElementScope({document});
      class Child extends EnElement {render() {return html`<button>${version}</button>`;}}
      class VersionParent extends Parent {}
      scope.register([{tagName:'scope-parent', elementClass:VersionParent, dependencies:[{tagName:'scope-child', elementClass:Child}]}]);
      const parent = scope.createElement('scope-parent'); document.body.append(parent); await parent.updateComplete;
      const child = parent.shadowRoot.querySelector('scope-child'); await child.updateComplete;
      results.push(child instanceof Child && child.shadowRoot.textContent.includes(version));
    }
    return results;
  });
  test.skip(result === 'unsupported', 'Engine has no native registry constructor');
  expect(result).toEqual([true,true]);
});

test('global entry behavior and conflicts remain explicit', async ({page}) => {
  const result = await page.evaluate(async () => {
    const {createElementScope, EnElement, html} = (window as any).scopeTest;
    const scope = createElementScope({document, registry:'global'});
    class Item extends EnElement {render() {return html`<button>Global</button>`;}}
    scope.register([{tagName:'scope-global',elementClass:Item}]);
    const item = scope.createElement('scope-global');document.body.append(item);await item.updateComplete;
    let collision = false;
    try {scope.register([{tagName:'scope-global',elementClass:class extends Item {}}]);} catch {collision=true;}
    return {mode:scope.mode, collision, registry:scope.registry === customElements, defined:await scope.whenDefined('scope-global') === Item, identity:scope.creationScope === document, button:!!item.shadowRoot.querySelector('button')};
  });
  expect(result).toEqual({mode:'global',collision:true,registry:true,defined:true,identity:true,button:true});
});

test('existing roots stay authoritative and explicit conflicts fail', async ({page}) => {
  const result = await page.evaluate(async () => {
    const {createElementScope, EnElement, html, elementScopeCapabilities} = (window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const scope = createElementScope({document}), other = createElementScope({document});
    class Root extends EnElement {render() {return html`<span>root</span>`;} makeRoot() {return this.createRenderRoot();}}
    class Explicit extends Root {getRenderRegistry() {return scope.registry;}}
    scope.register([{tagName:'scope-root',elementClass:Root},{tagName:'scope-explicit',elementClass:Explicit}]);
    const automatic = scope.createElement('scope-root'); const prior = automatic.attachShadow({mode:'open'});
    document.body.append(automatic);await automatic.updateComplete;
    const explicit = scope.createElement('scope-explicit');explicit.attachShadow({mode:'open',customElementRegistry:other.registry});
    let mismatch = false;try {explicit.makeRoot();} catch {mismatch=true;}
    let apiMismatch = false;try {scope.attachShadow(automatic);} catch {apiMismatch=true;}
    return {automatic:automatic.shadowRoot === prior && prior.customElementRegistry === customElements, mismatch, apiMismatch};
  });
  test.skip(result === 'unsupported');
  expect(result).toEqual({automatic:true,mismatch:true,apiMismatch:true});
});

test('null islands stay dormant until initialized; detached upgrades are explicit', async ({page}) => {
  const result = await page.evaluate(async () => {
    const {createElementScope, EnElement, elementScopeCapabilities} = (window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const scope = createElementScope({document});
    let constructed = 0;
    class Item extends EnElement {constructor() {super();constructed++;}}
    const islands = [0,1].map(() => {const root=document.createElement('div',{customElementRegistry:null});root.innerHTML='<scope-dormant></scope-dormant>';document.body.append(root);return root;});
    scope.register([{tagName:'scope-dormant',elementClass:Item}]);
    const before = constructed;
    scope.initialize(islands[0]);await (islands[0].firstElementChild as any).updateComplete;
    const after = constructed;
    let refused = false;try {scope.initialize(document.createElement('div'));} catch {refused=true;}
    const detached = scope.createElement('div');detached.innerHTML='<scope-late></scope-late>';
    class Late extends HTMLElement {}
    scope.register([{tagName:'scope-late',elementClass:Late}]);
    const notYet = !(detached.firstElementChild instanceof Late);scope.upgrade(detached);
    return {before,after,other:islands[1].firstElementChild!.customElementRegistry === null,refused,notYet,upgraded:detached.firstElementChild instanceof Late};
  });
  test.skip(result === 'unsupported');
  expect(result).toEqual({before:0,after:1,other:true,refused:true,notYet:true,upgraded:true});
});

test('boolean and options imports preserve deep versus shallow semantics', async ({page}) => {
  const result = await page.evaluate(() => {
    const {createElementScope}=(window as any).scopeTest;
    const scope=createElementScope({document});
    class Leaf extends HTMLElement {}
    scope.register([{tagName:'scope-import',elementClass:Leaf}]);
    const template=document.createElement('template');template.innerHTML='<scope-import></scope-import>';
    return {shallow:scope.creationScope.importNode(template.content,false).childNodes.length,deep:scope.creationScope.importNode(template.content,true).firstElementChild instanceof Leaf};
  });
  expect(result).toEqual({shallow:0,deep:true});
});

test('ignored import options use the qualified detached-document bridge', async ({page}) => {
  const result = await page.evaluate(() => {
    const {createElementScope, elementScopeCapabilities}=(window as any).scopeTest;
    let registry: CustomElementRegistry;
    try {registry=new CustomElementRegistry();} catch {return 'unsupported';}
    const original=Document.prototype.importNode;
    Document.prototype.importNode=function(node: any, options: any) {return original.call(this,node,typeof options === 'object' ? true : options);};
    try {
      const scope=createElementScope({document,registry});
      class Child extends HTMLElement {}
      scope.register([{tagName:'scope-old-import',elementClass:Child}]);
      const template=document.createElement('template');template.innerHTML='<scope-old-import></scope-old-import>';
      return {path:elementScopeCapabilities(document).importMode,deep:scope.creationScope.importNode(template.content,true).firstElementChild instanceof Child,shallow:scope.creationScope.importNode(template.content,false).childNodes.length};
    } finally {Document.prototype.importNode=original;}
  });
  test.skip(result === 'unsupported');
  expect(result).toEqual({path:'document',deep:true,shallow:0});
});

test('unsupported association falls back only in automatic mode', async ({page}) => {
  const result = await page.evaluate(() => {
    const {createElementScope}=(window as any).scopeTest;
    const requested=customElements; // Global remains a valid explicit target even without native scopes.
    const original=Element.prototype.attachShadow;
    Element.prototype.attachShadow=function(options) {return original.call(this,{mode:options.mode});};
    try {
      const auto=createElementScope({document});
      let failed=false;
      try {createElementScope({document,registry: {} as CustomElementRegistry});} catch {failed=true;}
      return {mode:auto.mode,failed,explicitGlobal:createElementScope({document,registry:requested}).registry === requested};
    } finally {Element.prototype.attachShadow=original;}
  });
  expect(result).toEqual({mode:'global',failed:true,explicitGlobal:true});
});

test('existing null roots remain dormant and follow explicit initialization on update', async ({page}) => {
  const result=await page.evaluate(async () => {
    const {createElementScope, EnElement, html, elementScopeCapabilities}=(window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const scope=createElementScope({document});
    class Child extends EnElement {}
    class Host extends EnElement {render() {return html`<scope-null-child></scope-null-child>`;}}
    scope.register([{tagName:'scope-null-host',elementClass:Host},{tagName:'scope-null-child',elementClass:Child}]);
    const host=scope.createElement('scope-null-host');
    host.attachShadow({mode:'open',customElementRegistry:null});document.body.append(host);await host.updateComplete;
    const child=host.shadowRoot.firstElementChild;
    const dormant=host.shadowRoot.customElementRegistry === null && child.customElementRegistry === null && !(child instanceof Child);
    scope.initialize(host.shadowRoot);host.requestUpdate();await host.updateComplete;await child.updateComplete;
    return {dormant,upgraded:child instanceof Child,context:host.renderOptions.creationScope === scope.creationScope};
  });
  test.skip(result === 'unsupported');
  expect(result).toEqual({dormant:true,upgraded:true,context:true});
});

test('explicit Lit shadowRootOptions and closed roots retain their registry', async ({page}) => {
  const result=await page.evaluate(async () => {
    const {createElementScope, EnElement, html, elementScopeCapabilities}=(window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const outer=createElementScope({document}),inner=createElementScope({document});
    class Child extends EnElement {}
    inner.register([{tagName:'scope-options-child',elementClass:Child}]);
    class Host extends EnElement {
      static shadowRootOptions={mode:'closed',customElementRegistry:inner.registry};
      render(){return html`<scope-options-child></scope-options-child>`;}
    }
    outer.register([{tagName:'scope-options-host',elementClass:Host}]);
    const host=outer.createElement('scope-options-host');document.body.append(host);await host.updateComplete;
    const child=host.renderRoot.querySelector('scope-options-child');await child.updateComplete;
    return {closed:host.shadowRoot === null,root:host.renderRoot.customElementRegistry === inner.registry,child:child instanceof Child,host:host.customElementRegistry === outer.registry};
  });
  test.skip(result === 'unsupported');
  expect(result).toEqual({closed:true,root:true,child:true,host:true});
});

test('global future imports select each destination version after repeated document adoption', async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const {EnElement, html, createElementScope} = (window as any).scopeTest;
    const globalScope = createElementScope({document, registry: 'global'});
    const registryNames = new Map<CustomElementRegistry, string>([[customElements, 'source-global']]);
    const registryOf = (node: Element | ShadowRoot) => 'customElementRegistry' in node ? node.customElementRegistry : undefined;
    const registryName = (node: Element | ShadowRoot | null) => !node ? 'absent' : !('customElementRegistry' in node) ? 'unavailable'
      : node.customElementRegistry === null ? 'null' : registryNames.get(node.customElementRegistry!) ?? 'other';
    class SourceChild extends HTMLElement {}
    class Host extends EnElement {
      static properties = {shown: {state: true}};
      declare shown: boolean;
      constructor() {super(); this.shown = false;}
      render() {return this.shown ? html`<scope-adopt-version-child></scope-adopt-version-child>` : html`<span>Essential content</span>`;}
    }
    customElements.define('scope-adopt-version-child', SourceChild);
    globalScope.register([{tagName: 'scope-adopt-global-host', elementClass: Host}]);
    const host = document.createElement('scope-adopt-global-host') as any;
    document.body.append(host); await host.updateComplete;
    const root = host.renderRoot;
    // Pair the existing global root with the same native root/adoption/import
    // operations. No initialize(), registry rebinding, or replacement node.
    const nativeHost = document.createElement('div');
    const nativeRoot = nativeHost.attachShadow({mode: 'open', customElementRegistry: customElements});
    document.body.append(nativeHost);
    const nativeTemplate = document.createElement('template');
    nativeTemplate.innerHTML = '<scope-adopt-version-child></scope-adopt-version-child>';
    const frames = [];
    for (const version of ['first', 'second']) {
      const frame = document.createElement('iframe');
      const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
      document.body.append(frame); await loaded;
      const destination = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
      class DestinationChild extends view.HTMLElement {version = version;}
      view.customElements.define('scope-adopt-version-child', DestinationChild);
      registryNames.set(view.customElements, `${version}-global`);
      frames.push({destination, view, DestinationChild, version});
    }
    let previous: Element | null = null;
    let previousNative: Element | null = null;
    const steps = [];
    const associations = [];
    for (const {destination, view, DestinationChild, version} of frames) {
      destination.adoptNode(host); destination.adoptNode(nativeHost);
      destination.body.append(host, nativeHost); await host.updateComplete;
      const fragment = destination.importNode(nativeTemplate.content, true);
      const nativeChild = fragment.firstElementChild!;
      const nativeImported = {
        destinationConstructor: nativeChild.constructor === DestinationChild,
        destinationVersion: nativeChild instanceof DestinationChild,
        sourceVersion: nativeChild instanceof SourceChild,
        destinationDocument: nativeChild.ownerDocument === destination,
        destinationRegistry: !('customElementRegistry' in nativeChild) || nativeChild.customElementRegistry === view.customElements,
        connected: nativeChild.isConnected,
      };
      nativeRoot.append(fragment);
      host.shown = true; await host.updateComplete;
      const child = root.querySelector('scope-adopt-version-child');
      steps.push({
        version: child?.version,
        destinationConstructor: child?.constructor === DestinationChild,
        destinationVersion: child instanceof DestinationChild,
        sourceVersion: child instanceof SourceChild,
        destinationDocument: child?.ownerDocument === destination,
        sameRoot: host.renderRoot === root,
        freshChild: child !== previous,
        count: root.querySelectorAll('scope-adopt-version-child').length,
        nativeImported,
        nativeInserted: {
          destinationConstructor: nativeChild.constructor === DestinationChild,
          destinationDocument: nativeChild.ownerDocument === destination,
          connected: nativeChild.isConnected,
          sameNode: nativeRoot.firstElementChild === nativeChild,
          sameRoot: nativeHost.shadowRoot === nativeRoot,
          freshChild: nativeChild !== previousNative,
          count: nativeRoot.querySelectorAll('scope-adopt-version-child').length,
        },
        registryParity: {
          supportedEqually: !!child && ('customElementRegistry' in child) === ('customElementRegistry' in nativeChild),
          sameChildRegistry: !!child && registryOf(child) === registryOf(nativeChild),
          sameRootRegistry: registryOf(root) === registryOf(nativeRoot),
          nativeRemainsGlobal: !('customElementRegistry' in nativeChild) || registryNames.has(nativeChild.customElementRegistry!),
        },
      });
      associations.push({version, libraryChild: registryName(child), nativeChild: registryName(nativeChild), libraryRoot: registryName(root), nativeRoot: registryName(nativeRoot)});
      previous = child; previousNative = nativeChild;
      host.shown = false; await host.updateComplete; nativeChild.remove();
      if (root.querySelector('scope-adopt-version-child')) throw new Error(`The ${version} branch was not removed before the next creation.`);
    }
    return {steps, associations};
  });
  await testInfo.attach('global-adoption-native-association-parity', {body: JSON.stringify({result, errors}, null, 2), contentType: 'application/json'});
  expect(result.steps).toEqual(['first', 'second'].map(version => ({
    version, destinationConstructor: true, destinationVersion: true, sourceVersion: false, destinationDocument: true,
    sameRoot: true, freshChild: true, count: 1,
    nativeImported: {destinationConstructor: true, destinationVersion: true, sourceVersion: false, destinationDocument: true, destinationRegistry: true, connected: false},
    nativeInserted: {destinationConstructor: true, destinationDocument: true, connected: true, sameNode: true, sameRoot: true, freshChild: true, count: 1},
    registryParity: {supportedEqually: true, sameChildRegistry: true, sameRootRegistry: true, nativeRemainsGlobal: true},
  })));
  expect(errors).toEqual([]);
});

test('first connection after global adoption selects destination children with or without a preattached open root', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const {EnElement, html, createElementScope} = (window as any).scopeTest;
    const globalScope = createElementScope({document, registry: 'global'});
    class SourceChild extends HTMLElement {}
    class Host extends EnElement {render() {return html`<scope-first-adopt-child></scope-first-adopt-child>`;}}
    customElements.define('scope-first-adopt-child', SourceChild);
    globalScope.register([{tagName: 'scope-first-adopt-host', elementClass: Host}]);
    const hosts = [false, true].map(preattached => {
      const host = document.createElement('scope-first-adopt-host') as any;
      const root = preattached ? host.attachShadow({mode: 'open'}) : undefined;
      return {host, root, preattached, cold: !host.hasUpdated && !host.renderRoot};
    });
    const frame = document.createElement('iframe');
    const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
    document.body.append(frame); await loaded;
    const destination = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
    class DestinationChild extends view.HTMLElement {}
    view.customElements.define('scope-first-adopt-child', DestinationChild);
    const checks = [];
    for (const {host, root, preattached, cold} of hosts) {
      destination.adoptNode(host); destination.body.append(host); await host.updateComplete;
      const child = host.renderRoot.querySelector('scope-first-adopt-child');
      checks.push({
        preattached, cold,
        destinationVersion: child instanceof DestinationChild,
        sourceVersion: child instanceof SourceChild,
        destinationDocument: host.ownerDocument === destination && child?.ownerDocument === destination,
        preservedOrCreatedRoot: preattached ? host.renderRoot === root : !!host.shadowRoot,
        count: host.renderRoot.querySelectorAll('scope-first-adopt-child').length,
      });
    }
    return checks;
  });
  expect(result).toEqual([false, true].map(preattached => ({
    preattached, cold: true, destinationVersion: true, sourceVersion: false,
    destinationDocument: true, preservedOrCreatedRoot: true, count: 1,
  })));
  expect(errors).toEqual([]);
});

test('explicit open and closed scoped roots retain their child version when global hosts move documents', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const {EnElement, html, createElementScope, elementScopeCapabilities} = (window as any).scopeTest;
    if (!elementScopeCapabilities(document).native) return 'unsupported';
    const scope = createElementScope({document});
    const globalScope = createElementScope({document, registry: 'global'});
    class ScopedChild extends HTMLElement {}
    scope.register([{tagName: 'scope-adopt-explicit-child', elementClass: ScopedChild}]);
    const hosts = [];
    for (const mode of ['open', 'closed'] as const) {
      class Host extends EnElement {
        static shadowRootOptions = {mode, customElementRegistry: scope.registry};
        static properties = {shown: {state: true}};
        declare shown: boolean;
        constructor() {super(); this.shown = false;}
        render() {return this.shown ? html`<scope-adopt-explicit-child></scope-adopt-explicit-child>` : html`<span>Essential content</span>`;}
      }
      const tag = `scope-adopt-explicit-${mode}`;
      globalScope.register([{tagName: tag, elementClass: Host}]);
      const host = document.createElement(tag) as any;
      document.body.append(host); await host.updateComplete;
      hosts.push({host, root: host.renderRoot, mode});
    }
    const destinations = [];
    for (let index = 0; index < 2; index++) {
      const frame = document.createElement('iframe');
      const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
      document.body.append(frame); await loaded;
      destinations.push(frame.contentDocument!);
    }
    const checks = [];
    for (const destination of destinations) for (const {host, root, mode} of hosts) {
      destination.adoptNode(host); destination.body.append(host); await host.updateComplete;
      host.shown = true; await host.updateComplete;
      const child = root.querySelector('scope-adopt-explicit-child');
      checks.push({
        mode, sameRoot: host.renderRoot === root,
        rootRegistry: root.customElementRegistry === scope.registry,
        childRegistry: child?.customElementRegistry === scope.registry,
        childVersion: child instanceof ScopedChild,
        destinationDocument: child?.ownerDocument === destination,
        visibility: mode === 'closed' ? host.shadowRoot === null : host.shadowRoot === root,
        destinationGlobalAbsent: !destination.defaultView!.customElements.get('scope-adopt-explicit-child'),
      });
      host.shown = false; await host.updateComplete;
    }
    return {checks, sourceGlobalAbsent: !customElements.get('scope-adopt-explicit-child')};
  });
  test.skip(result === 'unsupported', 'Native registry association required');
  expect(result).toEqual({
    sourceGlobalAbsent: true,
    checks: ['open', 'closed', 'open', 'closed'].map(mode => ({
      mode, sameRoot: true, rootRegistry: true, childRegistry: true, childVersion: true,
      destinationDocument: true, visibility: true, destinationGlobalAbsent: true,
    })),
  });
  expect(errors).toEqual([]);
});

// Initialize null roots before moving to preserve explicit scoped ownership.
// Native adoption of an uninitialized imperative-null root varies by engine.
test('explicit open and closed null roots initialize before adoption and retain their scoped registry for future imports', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const {EnElement, html, createElementScope, elementScopeCapabilities} = (window as any).scopeTest;
    const capability = elementScopeCapabilities(document);
    if (!capability.native || !capability.dormant) return 'unsupported';
    const scope = createElementScope({document});
    const globalScope = createElementScope({document, registry: 'global'});
    class ScopedChild extends HTMLElement {}
    scope.register([{tagName: 'scope-adopt-null-child', elementClass: ScopedChild}]);
    const hosts = [];
    for (const mode of ['open', 'closed'] as const) {
      class Host extends EnElement {
        static shadowRootOptions = {mode, customElementRegistry: null};
        static properties = {shown: {state: true}};
        declare shown: boolean;
        constructor() {super(); this.shown = false;}
        render() {return this.shown ? html`<scope-adopt-null-child></scope-adopt-null-child>` : html`<span>Essential content</span>`;}
      }
      const tag = `scope-adopt-null-${mode}`;
      globalScope.register([{tagName: tag, elementClass: Host}]);
      const host = document.createElement(tag) as any;
      document.body.append(host); await host.updateComplete;
      hosts.push({host, root: host.renderRoot, mode});
    }
    const destinations = [];
    for (let index = 0; index < 2; index++) {
      const frame = document.createElement('iframe');
      const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
      document.body.append(frame); await loaded;
      destinations.push(frame.contentDocument!);
    }
    const checks = [];
    for (const {host, root, mode} of hosts) {
      host.shown = true; await host.updateComplete;
      const dormantChild = root.querySelector('scope-adopt-null-child');
      const dormant = {rootNull: root.customElementRegistry === null, childNull: dormantChild?.customElementRegistry === null, defined: dormantChild.matches(':defined')};
      const dormantDocument = dormantChild?.ownerDocument === document;
      host.shown = false; await host.updateComplete;
      // Imperative null shadow roots can become global during native adoption.
      // Qualify explicit null initialization while this root still belongs to
      // the source document, then move the now-scoped association unchanged.
      scope.initialize(root);
      host.requestUpdate(); await host.updateComplete;
      host.shown = true; await host.updateComplete;
      const initializedChild = root.querySelector('scope-adopt-null-child');
      const initialized = {rootRegistry: root.customElementRegistry === scope.registry, childRegistry: initializedChild.customElementRegistry === scope.registry, version: initializedChild instanceof ScopedChild, document: initializedChild.ownerDocument === document};
      let previousChild = initializedChild;
      const adopted = [];
      for (const destination of destinations) {
        host.shown = false; await host.updateComplete;
        destination.adoptNode(host); destination.body.append(host); await host.updateComplete;
        host.shown = true; await host.updateComplete;
        const nextChild = root.querySelector('scope-adopt-null-child');
        adopted.push({
          rootRegistry: root.customElementRegistry === scope.registry,
          childRegistry: nextChild.customElementRegistry === scope.registry,
          version: nextChild instanceof ScopedChild,
          document: nextChild.ownerDocument === destination,
          freshChild: nextChild !== previousChild,
        });
        previousChild = nextChild;
      }
      checks.push({
        mode, dormant, dormantDocument, initialized, adopted,
        sameRoot: host.renderRoot === root,
        visibility: mode === 'closed' ? host.shadowRoot === null : host.shadowRoot === root,
      });
    }
    return checks;
  });
  test.skip(result === 'unsupported', 'Native dormant registry association required');
  expect(result).toEqual(['open', 'closed'].map(mode => ({
    mode, dormant: {rootNull: true, childNull: true, defined: false}, dormantDocument: true,
    initialized: {rootRegistry: true, childRegistry: true, version: true, document: true},
    adopted: [0, 1].map(() => ({rootRegistry: true, childRegistry: true, version: true, document: true, freshChild: true})),
    sameRoot: true, visibility: true,
  })));
  expect(errors).toEqual([]);
});

// Scoped adoption retains the original identity and focus assertions.
// Foreign-global first construction has the explicit rejection contract below.
for (const requested of ['scoped'] as Array<'global' | 'scoped'>) {
  test(`${requested}: a cold adopted deferred picker registers its calendar in the render creation registry`, async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const result = await page.evaluate(async requested => {
      const {createElementScope, elementScopeCapabilities, datePickerShellDefinition} = (window as any).scopeTest;
      if (requested === 'scoped' && !elementScopeCapabilities(document).native) return null;
      const source = createElementScope({document, registry: requested === 'global' ? 'global' : 'auto'});
      source.register([datePickerShellDefinition]);
      const picker = source.createElement('en-date-picker');
      picker.calendarLoading = 'deferred';
      picker.value = '2026-09-28';
      picker.today = '2026-09-28';
      document.body.append(picker);
      await picker.updateComplete;
      const root = picker.shadowRoot;
      const input = root.querySelector('input[type="date"]') as HTMLInputElement;
      const dialog = root.querySelector('en-dialog');
      await dialog.updateComplete;

      const frame = document.createElement('iframe');
      frame.title = 'Date picker adoption destination';
      const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
      frame.src = 'about:blank';
      document.body.append(frame);
      await loaded;
      const destinationDocument = frame.contentDocument!;
      const destination = createElementScope({document: destinationDocument, registry: 'global'});
      // Reuse constructor identities for the eager shell dependencies. The
      // scoped case keeps its source registry and needs no destination globals.
      if (requested === 'global') destination.register([datePickerShellDefinition]);
      const before = {
        sourceCalendarAbsent: !source.get('en-calendar'),
        destinationCalendarAbsent: !destination.get('en-calendar'),
        sourceGlobalCalendarAbsent: !customElements.get('en-calendar'),
        calendarCount: root.querySelectorAll('en-calendar').length,
      };

      destinationDocument.body.append(destinationDocument.adoptNode(picker));
      await picker.updateComplete;
      picker.focus();
      const activeElement = (owner: Document): Element | null => {
        let active = owner.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return active;
      };
      const focusedInputBeforeOpen = activeElement(destinationDocument) === input;
      await picker.showPicker();
      const calendar = root.querySelector('en-calendar');
      await calendar?.updateComplete;
      const expectedRegistry = requested === 'global' ? destination.registry : source.registry;
      const calendarClass = expectedRegistry.get('en-calendar');
      const focusedDate = calendar?.shadowRoot?.querySelector('button[data-date][tabindex="0"]');
      return {
        mode: source.mode,
        before,
        sourceCalendarDefined: !!source.get('en-calendar'),
        destinationCalendarDefined: !!destination.get('en-calendar'),
        sourceGlobalCalendarAbsent: !customElements.get('en-calendar'),
        sameRoot: picker.shadowRoot === root,
        sameNativeInput: !!input && root.querySelector('input[type="date"]') === input,
        sameDialog: root.querySelector('en-dialog') === dialog,
        nativeValue: input.value,
        ownerDocument: picker.ownerDocument === destinationDocument && root.ownerDocument === destinationDocument
          && input.ownerDocument === destinationDocument && calendar?.ownerDocument === destinationDocument,
        calendarCount: root.querySelectorAll('en-calendar').length,
        upgraded: !!calendarClass && calendar instanceof calendarClass,
        calendarRegistry: !!calendar && (!('customElementRegistry' in calendar) || calendar.customElementRegistry === expectedRegistry),
        scopedRootPreserved: requested === 'global' || root.customElementRegistry === source.registry,
        focusedInputBeforeOpen,
        dialogOpen: dialog.open,
        destinationFocus: !!focusedDate && activeElement(destinationDocument) === focusedDate
          && destinationDocument.activeElement === picker && document.activeElement === frame,
      };
    }, requested);
    test.skip(result === null, 'Native scoped registries are unavailable in this engine');
    expect(errors).toEqual([]);
    expect(result).toEqual({
      mode: requested,
      before: {sourceCalendarAbsent: true, destinationCalendarAbsent: true, sourceGlobalCalendarAbsent: true, calendarCount: 0},
      sourceCalendarDefined: requested === 'scoped',
      destinationCalendarDefined: requested === 'global',
      sourceGlobalCalendarAbsent: true,
      sameRoot: true,
      sameNativeInput: true,
      sameDialog: true,
      nativeValue: '2026-09-28',
      ownerDocument: true,
      calendarCount: 1,
      upgraded: true,
      calendarRegistry: true,
      scopedRootPreserved: true,
      focusedInputBeforeOpen: true,
      dialogOpen: true,
      destinationFocus: true,
    });
  });
}

// Parser-created declarative roots have distinct native adoption behavior.
// Compare actual native ownership before choosing scoped initialization.
test('declarative null roots follow native adoption ownership and reject rebinding initialized roots', async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const {EnElement, html, createElementScope, elementScopeCapabilities} = (window as any).scopeTest;
    const capability = elementScopeCapabilities(document);
    if (!capability.native || !capability.dormant) return {status: 'unsupported' as const};
    const mount = document.createElement('div');
    if (typeof mount.setHTMLUnsafe !== 'function') return {status: 'unsupported-parser' as const};
    const tag = 'scope-adopt-dsd-child';
    mount.setHTMLUnsafe('<scope-adopt-dsd-host><template shadowrootmode="open" shadowrootcustomelementregistry></template></scope-adopt-dsd-host><div><template shadowrootmode="open" shadowrootcustomelementregistry></template></div>');
    const host = mount.firstElementChild as any, nativeHost = mount.lastElementChild!;
    const root = host.shadowRoot as ShadowRoot, nativeRoot = nativeHost.shadowRoot;
    if (!root || !nativeRoot) throw new Error('The fixture did not parse actual declarative roots.');

    const scope = createElementScope({document}), globalScope = createElementScope({document, registry: 'global'});
    class ScopedChild extends HTMLElement {}
    class SourceGlobalChild extends HTMLElement {}
    scope.register([{tagName: tag, elementClass: ScopedChild}]);
    globalScope.register([{tagName: tag, elementClass: SourceGlobalChild}]);
    const registryNames = new Map<CustomElementRegistry | null | undefined, string>([
      [null, 'null'], [undefined, 'unavailable'], [customElements, 'source-global'], [scope.registry, 'scoped'],
    ]);
    const constructorNames = new Map<Function | undefined, string>([
      [undefined, 'absent'], [HTMLElement, 'source-HTMLElement'],
      [ScopedChild, 'scoped-child'], [SourceGlobalChild, 'source-global-child'],
    ]);
    const documentNames = new Map<Document, string>([[document, 'source']]);
    const registryName = (registry: CustomElementRegistry | null | undefined) => {
      if (!registryNames.has(registry)) registryNames.set(registry, `other-registry-${registryNames.size}`);
      return registryNames.get(registry)!;
    };
    const constructorName = (constructor: Function | undefined) => {
      if (!constructorNames.has(constructor)) constructorNames.set(constructor, `other-constructor-${constructorNames.size}`);
      return constructorNames.get(constructor)!;
    };
    const observe = (target: ShadowRoot) => {
      // Read each root and child independently. Labels share object identities;
      // none of these observations is derived from the other control.
      const registry = target.customElementRegistry;
      const child = target.querySelector(tag);
      const definition = registry?.get(tag);
      return {
        registry, child,
        snapshot: {
          rootRegistry: registryName(registry),
          rootDocument: documentNames.get(target.ownerDocument) ?? 'other-document',
          count: target.querySelectorAll(tag).length,
          childRegistry: child ? registryName(child.customElementRegistry) : 'absent',
          childDocument: child ? documentNames.get(child.ownerDocument) ?? 'other-document' : 'absent',
          childConstructor: constructorName(child?.constructor),
          registryDefinition: constructorName(definition),
          defined: child ? child.matches(':defined') : null,
          matchesDefinition: !!child && !!definition && child.constructor === definition,
        },
      };
    };
    const capture = () => {
      const library = observe(root), native = observe(nativeRoot);
      return {
        library: library.snapshot, native: native.snapshot,
        sameRootRegistry: library.registry === native.registry,
        sameChildRegistry: library.child?.customElementRegistry === native.child?.customElementRegistry,
        sameChildConstructor: library.child?.constructor === native.child?.constructor,
      };
    };
    const stages: Record<string, ReturnType<typeof capture>> = {};
    stages.parsed = capture();
    if (root.customElementRegistry !== null || nativeRoot.customElementRegistry !== null) {
      return {status: 'invalid-null-fixture' as const, stages};
    }

    class Host extends EnElement {
      static properties = {shown: {state: true}};
      declare shown: boolean;
      constructor() {super(); this.shown = false;}
      render() {return this.shown ? html`<scope-adopt-dsd-child></scope-adopt-dsd-child>` : html`<span>Essential content</span>`;}
    }
    // Parsing precedes registration so the normal open-root reuse path sees DSD.
    globalScope.register([{tagName: 'scope-adopt-dsd-host', elementClass: Host}]);
    globalScope.upgrade(host);
    document.body.append(host, nativeHost); await host.updateComplete;
    const show = async () => {
      host.shown = true; await host.updateComplete;
      nativeRoot.innerHTML = '<scope-adopt-dsd-child></scope-adopt-dsd-child>';
    };
    const hide = async () => {
      host.shown = false; await host.updateComplete;
      nativeRoot.replaceChildren();
      if (root.querySelector(tag) || nativeRoot.querySelector(tag)) throw new Error('A prior child branch was not removed.');
    };
    await show(); stages.source = capture();
    let previousLibraryChild = root.querySelector(tag), previousNativeChild = nativeRoot.querySelector(tag);
    await hide();

    const destinations: Document[] = [];
    for (const name of ['first', 'second']) {
      const frame = document.createElement('iframe');
      const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
      document.body.append(frame); await loaded;
      const destination = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
      class DestinationGlobalChild extends view.HTMLElement {}
      view.customElements.define(tag, DestinationGlobalChild);
      registryNames.set(view.customElements, `${name}-global`);
      constructorNames.set(view.HTMLElement, `${name}-HTMLElement`);
      constructorNames.set(DestinationGlobalChild, `${name}-global-child`);
      documentNames.set(destination, name);
      destinations.push(destination);
    }
    const freshness: {library: boolean; native: boolean}[] = [];
    const recordFreshness = () => {
      const libraryChild = root.querySelector(tag), nativeChild = nativeRoot.querySelector(tag);
      freshness.push({library: !!libraryChild && libraryChild !== previousLibraryChild, native: !!nativeChild && nativeChild !== previousNativeChild});
      previousLibraryChild = libraryChild; previousNativeChild = nativeChild;
    };
    const [first, second] = destinations;
    first.adoptNode(host); first.adoptNode(nativeHost);
    stages.firstAdopt = capture();
    // Capture both actual associations before deciding whether initialization is
    // applicable. Never reinterpret or repair a library/native disagreement.
    if (!stages.firstAdopt.sameRootRegistry) return {status: 'first-adoption-mismatch' as const, stages};
    first.body.append(host, nativeHost); await host.updateComplete;
    await show(); stages.first = capture(); recordFreshness();
    if (!stages.first.sameRootRegistry) return {status: 'first-render-mismatch' as const, stages};
    const path = nativeRoot.customElementRegistry === null ? 'retained-null' : 'promoted';
    await hide();

    // Construct outside the catch: only initialize(root) may establish rejection.
    // This wrapper owns the actual destination document and requests the existing
    // scoped registry. A foreign-document error cannot count as rebind rejection.
    const destinationScope = createElementScope({document: first, registry: scope.registry});
    const initialize = (target: ShadowRoot) => {
      const before = target.customElementRegistry;
      let error: {name: string; message: string} | null = null;
      try {destinationScope.initialize(target);} catch (cause) {
        error = {name: (cause as Error).name, message: (cause as Error).message};
      }
      return {
        before: registryName(before), after: registryName(target.customElementRegistry),
        unchanged: target.customElementRegistry === before,
        nowScoped: target.customElementRegistry === scope.registry,
        ownedDocument: target.ownerDocument === destinationScope.document,
        requestedScope: destinationScope.registry === scope.registry,
        error,
      };
    };
    const initialization = {library: initialize(root), native: initialize(nativeRoot)};
    host.requestUpdate(); await host.updateComplete;
    await show(); stages.afterInitialization = capture(); recordFreshness();
    await hide();

    second.adoptNode(host); second.adoptNode(nativeHost);
    stages.secondAdopt = capture();
    if (!stages.secondAdopt.sameRootRegistry) return {status: 'second-adoption-mismatch' as const, stages, path, initialization};
    second.body.append(host, nativeHost); await host.updateComplete;
    await show(); stages.second = capture(); recordFreshness();
    return {
      status: 'complete' as const, path, stages, initialization, freshness,
      sameRoots: host.renderRoot === root && host.shadowRoot === root && nativeHost.shadowRoot === nativeRoot,
    };
  });
  await testInfo.attach('declarative-null-native-parity-observations', {
    body: JSON.stringify({result, pageErrors: errors}, null, 2),
    contentType: 'application/json',
  });
  test.skip(result.status === 'unsupported' || result.status === 'unsupported-parser', 'Native dormant registries and setHTMLUnsafe DSD parsing required');
  expect(errors).toEqual([]);
  expect(result.status, JSON.stringify(result)).toBe('complete');
  if (result.status !== 'complete') return;

  const dormant = {rootRegistry: 'null', count: 1, childRegistry: 'null', defined: false, registryDefinition: 'absent', matchesDefinition: false};
  const defined = {count: 1, defined: true, matchesDefinition: true};
  for (const side of ['library', 'native'] as const) {
    expect(result.stages.parsed[side]).toMatchObject({rootRegistry: 'null', rootDocument: 'source', count: 0});
    expect(result.stages.source[side]).toMatchObject({...dormant, rootDocument: 'source', childDocument: 'source'});
    expect(result.stages.firstAdopt[side]).toMatchObject({rootDocument: 'first', count: 0, childDocument: 'absent'});
    expect(result.stages.first[side]).toMatchObject({rootDocument: 'first', childDocument: 'first', count: 1});
    expect(result.stages.afterInitialization[side]).toMatchObject({...defined, rootDocument: 'first', childDocument: 'first'});
    expect(result.stages.secondAdopt[side]).toMatchObject({rootDocument: 'second', count: 0, childDocument: 'absent'});
    expect(result.stages.second[side]).toMatchObject({...defined, rootDocument: 'second', childDocument: 'second'});
  }
  for (const stage of Object.values(result.stages)) {
    expect(stage.sameRootRegistry, JSON.stringify(stage)).toBe(true);
    expect(stage.sameChildRegistry, JSON.stringify(stage)).toBe(true);
  }
  for (const name of ['afterInitialization', 'second'] as const) {
    const stage = result.stages[name];
    expect(stage.sameChildConstructor, JSON.stringify(stage)).toBe(true);
    expect(stage.library.matchesDefinition).toBe(true);
    expect(stage.native.matchesDefinition).toBe(true);
  }
  if (result.path === 'retained-null') {
    for (const side of ['library', 'native'] as const) {
      expect(result.stages.firstAdopt[side].rootRegistry).toBe('null');
      expect(result.stages.first[side]).toMatchObject(dormant);
      expect(result.initialization[side]).toEqual({before: 'null', after: 'scoped', unchanged: false, nowScoped: true, ownedDocument: true, requestedScope: true, error: null});
      for (const name of ['afterInitialization', 'second'] as const) {
        expect(result.stages[name][side]).toMatchObject({...defined, rootRegistry: 'scoped', childRegistry: 'scoped', childConstructor: 'scoped-child', registryDefinition: 'scoped-child'});
      }
    }
  } else {
    // Some engines promote actual DSD ownership during adoption. Preserve that
    // measured native association and require its definition to construct both
    // children. Never force the root back to null or claim initialization worked.
    expect(result.path).toBe('promoted');
    expect(result.stages.first.sameChildConstructor).toBe(true);
    for (const side of ['library', 'native'] as const) {
      expect(result.stages.first[side]).toMatchObject(defined);
      expect(result.stages.first[side].rootRegistry).not.toBe('null');
      expect(result.stages.first[side].rootRegistry).not.toBe('scoped');
      const attempt = result.initialization[side];
      expect(attempt).toMatchObject({unchanged: true, nowScoped: false, ownedDocument: true, requestedScope: true, error: {name: 'Error', message: 'Cannot rebind a root that already belongs to another registry.'}});
      expect(attempt.before).toBe(result.stages.first[side].rootRegistry);
      expect(attempt.after).toBe(attempt.before);
      expect(result.stages.afterInitialization[side]).toMatchObject({...defined, rootRegistry: attempt.before});
      // The second native association is observed afresh; it need not equal
      // the first destination's global registry.
      expect(result.stages.second[side].rootRegistry).not.toBe('null');
      expect(result.stages.second[side].rootRegistry).not.toBe('scoped');
    }
  }
  expect(result.freshness).toEqual(Array.from({length: 3}, () => ({library: true, native: true})));
  expect(result.sameRoots).toBe(true);
  // Applications requiring a particular scoped registry across every engine
  // can initialize a null root before adoption; the open/closed companion test
  // verifies that alternative without changing an already-owned association.
});


const foreignCalendarErrorMessage = "Deferred calendar construction is unsupported for a source-realm picker in another document's global registry. Keep its native scoped registry or create a new picker from destination-realm modules.";

async function setupForeignCalendarError(page: import('@playwright/test').Page, sourceCalendarRegistered: boolean) {
  await page.evaluate(async sourceCalendarRegistered => {
    const {createElementScope, datePickerShellDefinition, datePickerDefinition} = (window as any).scopeTest;
    const source = createElementScope({document, registry: 'global'});
    source.register([datePickerShellDefinition]);
    const calendarDefinition = datePickerDefinition.dependencies.find((definition: any) => definition.tagName === 'en-calendar');
    if (!calendarDefinition) throw new Error('Missing calendar metadata in the existing scope fixture.');
    if (sourceCalendarRegistered) source.register([calendarDefinition]);
    const form = document.createElement('form'); form.id = 'adopted-picker-form';
    const picker = source.createElement('en-date-picker');
    picker.calendarLoading = 'deferred'; picker.name = 'eventDate'; picker.label = 'Adopted date';
    picker.defaultValue = '2026-09-18'; picker.value = '2026-09-28'; picker.today = '2026-09-28';
    picker.loadErrorLabel = 'Optional calendar unavailable';
    picker.loadRetryErrorLabel = 'Optional calendar retry {attempt} unavailable';
    form.append(picker); document.body.append(form); await picker.updateComplete;
    const root = picker.shadowRoot;
    const input = root.querySelector('input[type="date"]') as HTMLInputElement;
    const trigger = root.querySelector('#picker-trigger'), dialog = root.querySelector('en-dialog');
    await Promise.all([trigger.updateComplete, dialog.updateComplete]);
    const triggerControl = trigger.shadowRoot.querySelector('button') as HTMLButtonElement;
    let changes = 0, drafts = 0, vetoChanges = true;
    picker.addEventListener('en-change', (event: Event) => {changes++; if (vetoChanges) event.preventDefault();});
    picker.addEventListener('en-input', () => drafts++);
    input.focus(); input.value = '2026-10-02';
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
    await picker.updateComplete;

    const frame = document.createElement('iframe'); frame.id = 'foreign-picker-destination';
    const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), {once: true}));
    frame.src = 'about:blank'; document.body.append(frame); await loaded;
    const destinationDocument = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
    const destination = createElementScope({document: destinationDocument, registry: 'global'});
    destination.register([datePickerShellDefinition]);
    destinationDocument.body.append(destinationDocument.adoptNode(form));
    // Reconnection reattaches the native-editing listeners on the same input.
    picker.requestUpdate(); await picker.updateComplete;
    input.focus();
    const active = () => {
      let element: Element | null = destinationDocument.activeElement;
      while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
      return element;
    };
    let optionalDefineCalls = 0;
    const define = destination.registry.define;
    destination.registry.define = function(this: CustomElementRegistry, tag: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
      if (tag === 'en-calendar') optionalDefineCalls++;
      return define.call(this, tag, constructor, options);
    };
    const snapshot = () => ({
      sameHost: form.querySelector('en-date-picker') === picker,
      sameRoot: picker.shadowRoot === root,
      sameInput: root.querySelector('input[type="date"]') === input,
      sameTrigger: root.querySelector('#picker-trigger') === trigger && trigger.shadowRoot.querySelector('button') === triggerControl,
      sameDialog: root.querySelector('en-dialog') === dialog,
      ownerDocument: [form, picker, root, input, trigger, dialog].every(node => node.ownerDocument === destinationDocument),
      formAssociated: picker.form === form,
      accepted: picker.value, draft: input.value,
      submitted: new view.FormData(form).getAll('eventDate'),
      sourceCalendarDefined: !!source.get('en-calendar'),
      destinationCalendarDefined: !!destination.get('en-calendar'),
      optionalDefineCalls,
      calendarCount: root.querySelectorAll('en-calendar').length,
      dialogOpen: dialog.open,
      focus: active() === input ? 'input' : active() === triggerControl ? 'trigger' : 'other',
      outerFrameFocused: document.activeElement === frame,
      status: root.querySelector('[part~="calendar-status"]').textContent.trim(),
      statusLive: root.querySelector('[part~="calendar-status"]').getAttribute('aria-live'),
      changes, drafts,
    });
    (window as any).foreignCalendarErrorFixture = {picker, root, input, triggerControl, dialog, form, frame, destination, source, calendarDefinition, snapshot, acceptNativeEdits: () => {vetoChanges = false;}};
  }, sourceCalendarRegistered);
}

function foreignCalendarStableState(sourceCalendarRegistered: boolean) {
  return {
    sameHost: true, sameRoot: true, sameInput: true, sameTrigger: true, sameDialog: true,
    ownerDocument: true, formAssociated: true, accepted: '2026-09-28', draft: '2026-10-02',
    submitted: ['2026-09-28'], sourceCalendarDefined: sourceCalendarRegistered,
    destinationCalendarDefined: false, optionalDefineCalls: 0, calendarCount: 0, dialogOpen: false,
    focus: 'input', outerFrameFocused: true, status: '', statusLive: 'polite', changes: 1, drafts: 1,
  };
}

for (const sourceCalendarRegistered of [false, true]) {
  test(`unsupported foreign-global deferred calendar rejects before registration or mounting with source calendar ${sourceCalendarRegistered ? 'registered' : 'absent'}`, async ({page}) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await setupForeignCalendarError(page, sourceCalendarRegistered);
    const stable = foreignCalendarStableState(sourceCalendarRegistered);
    expect(await page.evaluate(() => (window as any).foreignCalendarErrorFixture.snapshot())).toEqual(stable);
    const first = await page.evaluate(async () => {
      const f = (window as any).foreignCalendarErrorFixture;
      const one = f.picker.showPicker(), two = f.picker.showPicker();
      const outcomes = await Promise.allSettled([one, two]);
      const reasons = outcomes.map(outcome => outcome.status === 'rejected' ? outcome.reason : undefined);
      f.lastFailure = reasons[0]; await f.picker.updateComplete;
      return {samePromise: one === two, statuses: outcomes.map(outcome => outcome.status), sameReason: reasons[0] === reasons[1], errors: reasons.map(error => ({name: error?.name, message: error?.message})), state: f.snapshot()};
    });
    expect(first).toEqual({
      samePromise: true, statuses: ['rejected', 'rejected'], sameReason: true,
      errors: [0, 1].map(() => ({name: 'Error', message: foreignCalendarErrorMessage})),
      state: {...stable, status: 'Optional calendar unavailable'},
    });
    const retry = await page.evaluate(async () => {
      const f = (window as any).foreignCalendarErrorFixture;
      const outcome = await Promise.allSettled([f.picker.showPicker()]);
      const error = outcome[0].status === 'rejected' ? outcome[0].reason : undefined;
      await f.picker.updateComplete;
      return {status: outcome[0].status, name: error?.name, message: error?.message, rechecked: !!error && error !== f.lastFailure, state: f.snapshot()};
    });
    expect(retry).toEqual({status: 'rejected', name: 'Error', message: foreignCalendarErrorMessage, rechecked: true, state: {...stable, status: 'Optional calendar retry 1 unavailable'}});

    // Exercise the real trigger route independently: its internal handler catches
    // the rejected showPicker promise and publishes the accessible local status.
    const nativeTrigger = page.frameLocator('#foreign-picker-destination').locator('en-date-picker').locator('#picker-trigger').locator('button');
    for (const attempt of [2, 3]) {
      await nativeTrigger.focus();
      await nativeTrigger.click();
      await expect.poll(() => page.evaluate(() => (window as any).foreignCalendarErrorFixture.snapshot())).toEqual({...stable, focus: 'trigger', status: `Optional calendar retry ${attempt} unavailable`});
    }
    const safe = await page.evaluate(async () => {
      const f = (window as any).foreignCalendarErrorFixture;
      f.input.focus(); f.picker.hidePicker();
      const view = f.frame.contentWindow;
      f.input.dispatchEvent(new view.KeyboardEvent('keydown', {key: 'Escape', bubbles: true, composed: true, cancelable: true}));
      await f.picker.updateComplete;
      const afterDismiss = f.snapshot();
      f.form.reset(); await f.picker.updateComplete;
      return {afterDismiss, afterReset: f.snapshot()};
    });
    expect(safe.afterDismiss).toEqual({...stable, status: 'Optional calendar retry 3 unavailable'});
    expect(safe.afterReset).toEqual({...stable, accepted: '2026-09-18', draft: '2026-09-18', submitted: ['2026-09-18'], status: 'Optional calendar retry 3 unavailable'});
    const nativeFallback = await page.evaluate(async () => {
      const f = (window as any).foreignCalendarErrorFixture;
      f.acceptNativeEdits(); f.input.focus(); f.input.value = '2026-10-04';
      f.input.dispatchEvent(new f.frame.contentWindow.Event('input', {bubbles: true, composed: true}));
      await f.picker.updateComplete;
      return f.snapshot();
    });
    expect(nativeFallback).toEqual({...stable, accepted: '2026-10-04', draft: '2026-10-04', submitted: ['2026-10-04'], status: 'Optional calendar retry 3 unavailable', changes: 2, drafts: 2});
    const sourceRecovery = await page.evaluate(async () => {
      const f = (window as any).foreignCalendarErrorFixture, owner = f.source.document;
      owner.body.append(owner.adoptNode(f.form));
      f.picker.requestUpdate(); await f.picker.updateComplete;
      f.input.focus();
      const active = () => {
        let element: Element | null = owner.activeElement;
        while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
        return element;
      };
      const before = {sourceCalendarDefined: !!f.source.get('en-calendar'), focusedInput: active() === f.input,
        accepted: f.picker.value, draft: f.input.value, submitted: new owner.defaultView.FormData(f.form).getAll('eventDate')};
      // The environment failure must not poison this same instance. A new
      // explicit opening rechecks its current owner and can use the source scope.
      await f.picker.showPicker();
      const calendar = f.root.querySelector('en-calendar'), expected = f.calendarDefinition.elementClass;
      const focusedDate = calendar?.shadowRoot?.querySelector('button[data-date][tabindex="0"]');
      return {
        before,
        sameHost: f.form.querySelector('en-date-picker') === f.picker,
        sameRoot: f.picker.shadowRoot === f.root,
        sameInput: f.root.querySelector('input[type="date"]') === f.input,
        sameTrigger: f.root.querySelector('#picker-trigger').shadowRoot.querySelector('button') === f.triggerControl,
        sameDialog: f.root.querySelector('en-dialog') === f.dialog,
        ownerDocument: [f.form, f.picker, f.root, f.input, f.dialog, calendar].every(node => node?.ownerDocument === owner),
        formAssociated: f.picker.form === f.form,
        accepted: f.picker.value, draft: f.input.value, submitted: new owner.defaultView.FormData(f.form).getAll('eventDate'),
        exactSourceDefinition: f.source.get('en-calendar') === expected,
        exactSourceCalendar: !!calendar && calendar.constructor === expected && calendar.matches(':defined'),
        sourceCalendarRegistry: !!calendar && (!('customElementRegistry' in calendar) || calendar.customElementRegistry === f.source.registry),
        destinationCalendarAbsent: !f.destination.get('en-calendar'),
        calendarCount: f.root.querySelectorAll('en-calendar').length,
        dialogOpen: f.dialog.open,
        focusedDate: !!focusedDate && active() === focusedDate && owner.activeElement === f.picker,
        status: f.root.querySelector('[part~="calendar-status"]').textContent.trim(),
      };
    });
    expect(sourceRecovery).toEqual({
      before: {sourceCalendarDefined: sourceCalendarRegistered, focusedInput: true, accepted: '2026-10-04', draft: '2026-10-04', submitted: ['2026-10-04']},
      sameHost: true, sameRoot: true, sameInput: true, sameTrigger: true, sameDialog: true,
      ownerDocument: true, formAssociated: true, accepted: '2026-10-04', draft: '2026-10-04', submitted: ['2026-10-04'],
      exactSourceDefinition: true, exactSourceCalendar: true, sourceCalendarRegistry: true,
      destinationCalendarAbsent: true, calendarCount: 1, dialogOpen: true, focusedDate: true, status: '',
    });
    expect(errors).toEqual([]);
  });
}

for (const action of ['hide', 'Escape', 'reset'] as const) {
  test(`foreign-global pending open canceled by ${action} resolves before the scope check and does not consume a retry`, async ({page}) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await setupForeignCalendarError(page, false);
    const result = await page.evaluate(async action => {
      const f = (window as any).foreignCalendarErrorFixture;
      const one = f.picker.showPicker(), two = f.picker.showPicker();
      let escapeCanceled: boolean | null = null;
      if (action === 'hide') f.picker.hidePicker();
      else if (action === 'reset') f.form.reset();
      else {
        const event = new f.frame.contentWindow.KeyboardEvent('keydown', {key: 'Escape', bubbles: true, composed: true, cancelable: true});
        f.input.dispatchEvent(event); escapeCanceled = event.defaultPrevented;
      }
      const outcomes = await Promise.allSettled([one, two]); await f.picker.updateComplete;
      const canceled = f.snapshot();
      const next = await Promise.allSettled([f.picker.showPicker()]); await f.picker.updateComplete;
      const error = next[0].status === 'rejected' ? next[0].reason : undefined;
      return {samePromise: one === two, statuses: outcomes.map(outcome => outcome.status), escapeCanceled, canceled, next: {status: next[0].status, name: error?.name, message: error?.message, state: f.snapshot()}};
    }, action);
    const stable = {...foreignCalendarStableState(false), ...(action === 'reset' ? {accepted: '2026-09-18', draft: '2026-09-18', submitted: ['2026-09-18']} : {})};
    expect(result).toEqual({
      samePromise: true, statuses: ['fulfilled', 'fulfilled'], escapeCanceled: action === 'Escape' ? true : null, canceled: stable,
      next: {status: 'rejected', name: 'Error', message: foreignCalendarErrorMessage, state: {...stable, status: 'Optional calendar unavailable'}},
    });
    expect(errors).toEqual([]);
  });
}

test('a target calendar constructor collision keeps registration-error precedence and permanent identity', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await setupForeignCalendarError(page, false);
  const result = await page.evaluate(async () => {
    const f = (window as any).foreignCalendarErrorFixture, view = f.frame.contentWindow;
    class ExistingCalendar extends view.HTMLElement {}
    f.destination.registry.define('en-calendar', ExistingCalendar);
    const failures = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const outcome = await Promise.allSettled([f.picker.showPicker()]);
      failures.push(outcome[0].status === 'rejected' ? outcome[0].reason : undefined);
      await f.picker.updateComplete;
    }
    return {errors: failures.map(error => ({name: error?.name, message: error?.message})), sameError: !!failures[0] && failures[0] === failures[1], retainedConstructor: f.destination.get('en-calendar') === ExistingCalendar, state: f.snapshot()};
  });
  expect(result).toEqual({
    errors: [0, 1].map(() => ({name: 'Error', message: 'A different version of en-calendar is already registered.'})),
    sameError: true, retainedConstructor: true,
    state: {...foreignCalendarStableState(false), destinationCalendarDefined: true, optionalDefineCalls: 1, status: 'Optional calendar retry 1 unavailable'},
  });
  expect(errors).toEqual([]);
});

for (const requested of ['global', 'scoped'] as const) {
  test(`same-document ${requested} deferred calendar still opens and focuses its owned calendar`, async ({page}) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const result = await page.evaluate(async requested => {
      const {createElementScope, elementScopeCapabilities, datePickerShellDefinition} = (window as any).scopeTest;
      if (requested === 'scoped' && !elementScopeCapabilities(document).native) return null;
      const scope = createElementScope({document, registry: requested === 'global' ? 'global' : 'auto'});
      scope.register([datePickerShellDefinition]);
      const picker = scope.createElement('en-date-picker'); picker.calendarLoading = 'deferred'; picker.value = '2026-09-28'; picker.today = '2026-09-28';
      document.body.append(picker); await picker.updateComplete;
      const root = picker.shadowRoot, input = root.querySelector('input[type="date"]'), dialog = root.querySelector('en-dialog');
      await dialog.updateComplete;
      const absentBefore = !scope.get('en-calendar') && !root.querySelector('en-calendar');
      picker.focus(); await picker.showPicker();
      const calendar = root.querySelector('en-calendar'), selected = calendar.shadowRoot.querySelector('button[data-date][tabindex="0"]');
      let active: Element | null = document.activeElement; while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return {absentBefore, sameRoot: picker.shadowRoot === root, sameInput: root.querySelector('input[type="date"]') === input, sameDialog: root.querySelector('en-dialog') === dialog, instance: calendar instanceof scope.get('en-calendar'), registry: !('customElementRegistry' in calendar) || calendar.customElementRegistry === scope.registry, ownerDocument: calendar.ownerDocument === document, dialogOpen: dialog.open, focusedDate: !!selected && active === selected, status: root.querySelector('[part~="calendar-status"]').textContent.trim()};
    }, requested);
    test.skip(result === null, 'Native scoped registries unavailable');
    expect(result).toEqual({absentBefore: true, sameRoot: true, sameInput: true, sameDialog: true, instance: true, registry: true, ownerDocument: true, dialogOpen: true, focusedDate: true, status: ''});
    expect(errors).toEqual([]);
  });
}

test('fallback: a fresh destination-module deferred picker opens in an unconflicted destination global', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => {
    const frame = document.createElement('iframe'); frame.id = 'fresh-picker-destination'; frame.src = '/probes/scoped-registry/'; document.body.append(frame);
  });
  await page.waitForFunction(() => Boolean(((document.querySelector('#fresh-picker-destination') as HTMLIFrameElement)?.contentWindow as any)?.scopeTest));
  const result = await page.evaluate(async () => {
    const frame = document.querySelector('#fresh-picker-destination') as HTMLIFrameElement;
    const destinationDocument = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
    const fixture = (view as any).scopeTest, sourceFixture = (window as any).scopeTest;
    const destination = fixture.createElementScope({document: destinationDocument, registry: 'global'});
    const unconflictedBefore = !destination.get('en-date-picker') && !destination.get('en-calendar');
    destination.register([fixture.datePickerShellDefinition]);
    // This is an explicitly new instance from the destination module. Only
    // supported authored state is copied; no adopted-node identity is recovered.
    const picker = destination.createElement('en-date-picker'); picker.calendarLoading = 'deferred';
    picker.name = 'eventDate'; picker.defaultValue = '2026-09-18'; picker.value = '2026-09-28'; picker.today = '2026-09-28';
    const form = destinationDocument.createElement('form'); form.append(picker); destinationDocument.body.append(form); await picker.updateComplete;
    const before = !destination.get('en-calendar') && !picker.shadowRoot.querySelector('en-calendar');
    picker.focus(); await picker.showPicker();
    const calendar = picker.shadowRoot.querySelector('en-calendar'), dialog = picker.shadowRoot.querySelector('en-dialog');
    const destinationCalendar = fixture.datePickerDefinition.dependencies.find((definition: any) => definition.tagName === 'en-calendar').elementClass;
    let active: Element | null = destinationDocument.activeElement; while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {unconflictedBefore, before, destinationPicker: picker.constructor === fixture.datePickerShellDefinition.elementClass, differentSourceClass: picker.constructor !== sourceFixture.datePickerShellDefinition.elementClass, destinationCalendar: calendar.constructor === destinationCalendar, registry: !('customElementRegistry' in calendar) || calendar.customElementRegistry === destination.registry, ownerDocument: picker.ownerDocument === destinationDocument && calendar.ownerDocument === destinationDocument, formAssociated: picker.form === form, submitted: new view.FormData(form).getAll('eventDate'), dialogOpen: dialog.open, focusedDate: active === calendar.shadowRoot.querySelector('button[data-date][tabindex="0"]'), sourceCalendarAbsent: !customElements.get('en-calendar')};
  });
  expect(result).toEqual({unconflictedBefore: true, before: true, destinationPicker: true, differentSourceClass: true, destinationCalendar: true, registry: true, ownerDocument: true, formAssociated: true, submitted: ['2026-09-28'], dialogOpen: true, focusedDate: true, sourceCalendarAbsent: true});
  expect(errors).toEqual([]);
});


// Constructor registration must not override a node's actual scoped/null
// association or an explicit or existing render-root registry.
test('actual scoped and null ownership overrides global constructor registration', async ({page}, info) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const result = await page.evaluate(async () => {
    const {html, createElementScope, elementScopeCapabilities} = (window as any).scopeTest;
    const EnElement = (window as any).scopeTest.EnElement as typeof import('../../packages/elements/src/internal/en-element.js').EnElement;
    const capability = elementScopeCapabilities(document);
    if (!capability.native || !capability.dormant) return {status: 'unsupported' as const};
    const scope = createElementScope({document});
    class GlobalLeaf extends HTMLElement {}
    class ScopedLeaf extends HTMLElement {}
    customElements.define('scope-strict-owner-leaf', GlobalLeaf);
    scope.registry.define('scope-strict-owner-leaf', ScopedLeaf);
    const label = (registry: CustomElementRegistry | null | undefined) => registry === customElements ? 'global' : registry === scope.registry ? 'scoped' : registry === null ? 'null' : 'other';
    const cases = [
      {id: 'global-in-scoped', registration: 'global', creation: 'global', container: 'scoped', precedence: 'automatic'},
      {id: 'global-in-null', registration: 'global', creation: 'global', container: 'null', precedence: 'automatic'},
      {id: 'explicit-scoped-in-null', registration: 'global', creation: 'global', container: 'null', precedence: 'requested-scoped'},
      {id: 'existing-null-in-scoped', registration: 'global', creation: 'global', container: 'scoped', precedence: 'existing-null'},
      {id: 'scoped-only-create', registration: 'scoped', creation: 'scoped', container: 'global', precedence: 'automatic'},
      {id: 'shared-global-and-scoped-create', registration: 'shared', creation: 'scoped', container: 'global', precedence: 'automatic'},
      {id: 'scoped-only-null-initialize', registration: 'scoped', creation: 'null', container: 'null', precedence: 'automatic'},
      {id: 'shared-global-and-scoped-null-initialize', registration: 'shared', creation: 'null', container: 'null', precedence: 'automatic'},
    ];
    const rows = [];
    for (const scenario of cases) {
      const expectedContainer = scenario.container === 'scoped' ? scope.registry : scenario.container === 'null' ? null : customElements;
      const parent = document.createElement('div'), container = parent.attachShadow({mode: 'open', customElementRegistry: expectedContainer});
      let connectionError: {name: string; message: string} | null = null;
      class Host extends EnElement {
        getRenderRegistry() {return scenario.precedence === 'requested-scoped' ? scope.registry : undefined;}
        connectedCallback() {
          try {super.connectedCallback();}
          catch (error) {connectionError = {name: (error as Error).name, message: (error as Error).message};}
        }
        render() {return html`<scope-strict-owner-leaf></scope-strict-owner-leaf>`;}
      }
      const tag = `scope-strict-owner-${scenario.id}`;
      if (scenario.registration !== 'scoped') customElements.define(tag, Host);
      if (scenario.registration !== 'global') scope.registry.define(tag, Host);
      const node = scenario.creation === 'global' ? document.createElement(tag)
        : document.createElement(tag, {customElementRegistry: scenario.creation === 'scoped' ? scope.registry : null});
      const host = node as Host;
      const created = {registry: label(host.customElementRegistry), rootAbsent: !host.shadowRoot, ownerDocument: host.ownerDocument === document};
      const existing = scenario.precedence === 'existing-null' ? host.attachShadow({mode: 'open', customElementRegistry: null}) : undefined;
      container.append(host);
      const before = {registry: label(host.customElementRegistry), container: label(container.customElementRegistry), defined: host.matches(':defined'), constructorMatches: host.constructor === Host};
      if (scenario.creation === 'null') scope.initialize(container);
      const initialized = {sameNode: container.firstElementChild === node, registry: label(host.customElementRegistry), container: label(container.customElementRegistry), constructorMatches: host.constructor === Host, defined: host.matches(':defined')};
      document.body.append(parent);
      let updateError: {name: string; message: string} | null = null;
      if (!connectionError) {
        try {await host.updateComplete;}
        catch (error) {updateError = {name: (error as Error).name, message: (error as Error).message};}
      }
      const root = host.shadowRoot, leaf = root?.querySelector('scope-strict-owner-leaf');
      rows.push({scenario, created, before, initialized, connectionError, updateError,
        registration: {global: customElements.get(tag) === Host, scoped: scope.registry.get(tag) === Host},
        final: {sameNode: container.firstElementChild === node, constructorMatches: host.constructor === Host,
          hostRegistry: label(host.customElementRegistry), rootRegistry: root ? label(root.customElementRegistry) : 'absent',
          rootIdentity: !!root && root === (host as any).renderRoot && (!existing || root === existing),
          ownerDocument: host.ownerDocument === document && root?.ownerDocument === document && leaf?.ownerDocument === document,
          leafCount: root?.querySelectorAll('scope-strict-owner-leaf').length ?? 0,
          leafRegistry: leaf ? label(leaf.customElementRegistry) : 'absent', leafDefined: !!leaf && leaf.matches(':defined'),
          leafConstructor: leaf?.constructor === GlobalLeaf ? 'global' : leaf?.constructor === ScopedLeaf ? 'scoped' : 'undefined-or-other'}});
    }
    return {status: 'complete' as const, rows};
  });
  await info.attach('strict-actual-registry-ownership', {body: JSON.stringify({result, pageErrors}, null, 2), contentType: 'application/json'});
  test.skip(result.status === 'unsupported', 'Native scoped and dormant registries required');
  expect(pageErrors).toEqual([]);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.rows).toHaveLength(8);
  for (const row of result.rows) {
    const hostRegistry = row.scenario.creation === 'global' ? 'global' : 'scoped';
    const rootRegistry = row.scenario.precedence === 'requested-scoped' ? 'scoped' : row.scenario.precedence === 'existing-null' ? 'null' : hostRegistry;
    expect(row.registration).toEqual({global: row.scenario.registration !== 'scoped', scoped: row.scenario.registration !== 'global'});
    expect(row.created).toEqual({registry: row.scenario.creation, rootAbsent: true, ownerDocument: true});
    expect(row.before).toMatchObject({registry: row.scenario.creation, container: row.scenario.container});
    if (row.scenario.creation === 'null' && row.scenario.registration === 'scoped') {
      expect(row.before).toMatchObject({defined: false, constructorMatches: false});
    }
    // Shared globally/scoped null creation may already be constructed. Its
    // actual null association, then exact scoped initialization, are authoritative.
    expect(row.initialized).toEqual({sameNode: true, registry: hostRegistry, container: row.scenario.creation === 'null' ? 'scoped' : row.scenario.container, constructorMatches: true, defined: true});
    expect(row.connectionError).toBeNull();
    expect(row.updateError).toBeNull();
    expect(row.final).toEqual({sameNode: true, constructorMatches: true, hostRegistry, rootRegistry, rootIdentity: true, ownerDocument: true,
      leafCount: 1, leafRegistry: rootRegistry, leafDefined: rootRegistry !== 'null', leafConstructor: rootRegistry === 'null' ? 'undefined-or-other' : rootRegistry});
  }
});


// Only an immediate, cooperative render owner may supply a global creation
// context. Every case has a fresh destination realm before the first child root.
for (const mode of [
  'missing-nearest-parent', 'accessor-mask', 'nonfunction-mask',
  'malformed-function', 'throwing-provider', 'reentrant-move', 'reentrant-null-request',
] as const) {
  test(`parent render context boundary: ${mode}`, async ({page}, info) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.evaluate(() => {
      const frame = document.createElement('iframe');
      frame.id = 'parent-proof-boundary-destination';
      frame.title = 'Independent parent proof destination';
      frame.src = '/probes/scoped-registry/';
      document.body.append(frame);
    });
    await page.waitForFunction(() => Boolean(((document.querySelector('#parent-proof-boundary-destination') as HTMLIFrameElement)?.contentWindow as any)?.scopeTest));
    const result = await page.evaluate(async mode => {
      const sourceFixture = (window as any).scopeTest;
      const SourceEn = sourceFixture.EnElement as typeof import('../../packages/elements/src/internal/en-element.js').EnElement;
      const frame = document.querySelector('#parent-proof-boundary-destination') as HTMLIFrameElement;
      const destination = frame.contentDocument!, view = frame.contentWindow as Window & typeof globalThis;
      const destinationFixture = (view as any).scopeTest;
      const DestinationEn = destinationFixture.EnElement as typeof import('../../packages/elements/src/internal/en-element.js').EnElement;
      const sourceRegistry = customElements, destinationRegistry = view.customElements;
      // Inspect the recognized protocol through descriptors only. This test
      // deliberately exercises masking and callbacks at the cooperation boundary.
      const protocol = Symbol.for('@en-reve/elements/render-creation-context/v1');
      const findProvider = (host: object): Function | undefined => {
        for (let owner: object | null = host; owner; owner = Object.getPrototypeOf(owner)) {
          const descriptor = Object.getOwnPropertyDescriptor(owner, protocol);
          if (descriptor) return 'value' in descriptor && typeof descriptor.value === 'function' ? descriptor.value : undefined;
        }
        return undefined;
      };
      const label = (registry: CustomElementRegistry | null | undefined) => registry === undefined ? 'unavailable'
        : registry === null ? 'null' : registry === sourceRegistry ? 'source-global'
          : registry === destinationRegistry ? 'destination-global' : 'other';
      class Parent extends SourceEn {
        override render() {return sourceFixture.html`<span>Parent content</span>`;}
      }
      customElements.define('scope-parent-proof-owner', Parent);
      const parent = document.createElement('scope-parent-proof-owner') as Parent;
      document.body.append(parent); await parent.updateComplete;
      const outerRoot = parent.shadowRoot!;
      if (!outerRoot) throw new Error('The source owner did not create its actual shadow root.');
      const sourceOuterRegistry = outerRoot.customElementRegistry;
      let containingRoot = outerRoot;
      if (mode === 'missing-nearest-parent') {
        const nativeHost = document.createElement('div');
        containingRoot = nativeHost.attachShadow({mode: 'open'});
        outerRoot.append(nativeHost);
      }
      const sourceContainingRegistry = containingRoot.customElementRegistry;
      const provider = findProvider(parent);
      if (!provider) throw new Error('The real source EnElement provider was not found.');
      destination.adoptNode(parent); destination.body.append(parent); await parent.updateComplete;
      const containingAfterAdopt = containingRoot.customElementRegistry;
      const outerAfterAdopt = outerRoot.customElementRegistry;
      // Validate the real parent's private proof without invoking a wrapper.
      const providerValidated = outerAfterAdopt === undefined ? null
        : Reflect.apply(provider, parent, [outerRoot, destination, outerAfterAdopt]) === destinationRegistry;
      const counts = {accessorReads: 0, providerCalls: 0, boundaryCalls: 0};
      const sentinel = new Error('Parent proof provider sentinel');
      const holding = destination.createDocumentFragment();
      let child: DestinationChild | undefined;
      const wrappedProvider = function(this: object, ...args: unknown[]) {
        counts.providerCalls++;
        return Reflect.apply(provider, this, args);
      };
      // An inherited wrapper also reveals accidental traversal past a nearer
      // masking descriptor, without changing the provider's private brand.
      Object.defineProperty(Parent.prototype, protocol, {configurable: true, value: wrappedProvider});
      if (mode === 'accessor-mask') {
        Object.defineProperty(parent, protocol, {configurable: true, get() {counts.accessorReads++; return wrappedProvider;}});
      } else if (mode === 'nonfunction-mask') {
        Object.defineProperty(parent, protocol, {configurable: true, value: {unsupported: true}});
      } else if (mode === 'malformed-function') {
        Object.defineProperty(parent, protocol, {configurable: true, value: function(this: object, ...args: unknown[]) {
          counts.boundaryCalls++;
          return {registry: Reflect.apply(wrappedProvider, this, args)};
        }});
      } else if (mode === 'throwing-provider') {
        Object.defineProperty(parent, protocol, {configurable: true, value: function() {counts.boundaryCalls++; throw sentinel;}});
      } else if (mode === 'reentrant-move' || mode === 'reentrant-null-request') {
        Object.defineProperty(parent, protocol, {configurable: true, value: function(this: object, ...args: unknown[]) {
          counts.boundaryCalls++;
          const result = Reflect.apply(wrappedProvider, this, args);
          if (!child) throw new Error('The cooperative query preceded child creation.');
          if (mode === 'reentrant-move') holding.append(child);
          else child.requestedRegistry = null;
          return result;
        }});
      }
      const ownRoot = (node: HTMLElement) => (Object.getOwnPropertyDescriptor(node, 'renderRoot')?.value ?? node.shadowRoot) as ShadowRoot | undefined;
      const snapshot = (node: HTMLElement) => {
        const root = ownRoot(node);
        return {
          document: node.ownerDocument === destination,
          registry: label(node.customElementRegistry),
          connected: node.isConnected,
          exactContainingRoot: node.getRootNode() === containingRoot,
          containingRegistry: label((node.getRootNode() as ShadowRoot).customElementRegistry),
          root: !!root, rootRegistry: root ? label(root.customElementRegistry) : 'absent',
          rootDocument: !!root && root.ownerDocument === destination,
          rendered: !!root?.querySelector('[data-parent-proof-content]'),
        };
      };
      let connectedRaw: CustomElementRegistry | null | undefined;
      let connectedNode: DestinationChild | undefined;
      let connectedBefore: ReturnType<typeof snapshot> | undefined;
      let connectedAfter: ReturnType<typeof snapshot> | undefined;
      let connectedCalls = 0, completed = false, returnedRoots = 0;
      let connectionError: {name: string; message: string; sameSentinel: boolean} | null = null;
      class DestinationChild extends DestinationEn {
        requestedRegistry: CustomElementRegistry | null | undefined = undefined;
        override getRenderRegistry() {return this.requestedRegistry;}
        override createRenderRoot() {const root = super.createRenderRoot(); returnedRoots++; return root;}
        override connectedCallback() {
          connectedCalls++; connectedNode = this; connectedRaw = this.customElementRegistry; connectedBefore = snapshot(this);
          try {super.connectedCallback(); completed = true;}
          catch (error) {connectionError = {name: (error as Error).name, message: (error as Error).message, sameSentinel: error === sentinel};}
          connectedAfter = snapshot(this);
        }
        override render() {return destinationFixture.html`<span data-parent-proof-content>Child content</span>`;}
      }
      view.customElements.define('scope-parent-proof-child', DestinationChild);
      child = destination.createElement('scope-parent-proof-child') as DestinationChild;
      const beforeAppend = snapshot(child);
      const exactChild = child;
      containingRoot.append(child);
      if (completed) await child.updateComplete;
      const after = snapshot(child);
      const foreignPath = connectedRaw !== undefined && connectedRaw !== null && connectedRaw === sourceRegistry && sourceRegistry !== destinationRegistry;
      return {
        mode, branch: foreignPath ? 'foreign-registry-boundary' : 'native-current-or-unavailable',
        rejectionPathExercised: foreignPath,
        setup: {
          distinctEnCopies: SourceEn !== DestinationEn,
          destinationNativeBase: view.HTMLElement.prototype.isPrototypeOf(child),
          destinationConstructor: child.constructor === DestinationChild,
          sourceParent: parent instanceof Parent,
          sourceOuterRegistry: label(sourceOuterRegistry), sourceContainingRegistry: label(sourceContainingRegistry),
          adoptedOuterRegistry: label(outerAfterAdopt), adoptedContainingRegistry: label(containingAfterAdopt),
          providerValidated,
          missingNearestOwner: mode !== 'missing-nearest-parent' || containingRoot.host.localName === 'div' && containingRoot.host.getRootNode() === outerRoot,
        },
        beforeAppend,
        connectedBefore: connectedBefore as ReturnType<typeof snapshot> | undefined,
        connectedAfter: connectedAfter as ReturnType<typeof snapshot> | undefined,
        after, counts, connectedCalls, completed, returnedRoots,
        connectionError: connectionError as {name: string; message: string; sameSentinel: boolean} | null,
        sameChild: child === exactChild && connectedNode === exactChild, sameParentRoot: parent.shadowRoot === outerRoot,
        containingRootPreserved: containingRoot.host.shadowRoot === containingRoot && containingRoot.ownerDocument === destination,
        containingRegistryUnchanged: containingRoot.customElementRegistry === containingAfterAdopt,
        hostAssociationUnchanged: child.customElementRegistry === connectedRaw,
        childInHoldingFragment: child.getRootNode() === holding,
        requestedNull: child.requestedRegistry === null,
      };
    }, mode);
    await info.attach('parent-proof-boundary-observations', {body: JSON.stringify({result, pageErrors}, null, 2), contentType: 'application/json'});
    expect(pageErrors).toEqual([]);
    expect(result.setup).toMatchObject({distinctEnCopies: true, destinationNativeBase: true, destinationConstructor: true, sourceParent: true, missingNearestOwner: true});
    expect(['source-global', 'unavailable']).toContain(result.setup.sourceOuterRegistry);
    expect(['source-global', 'unavailable']).toContain(result.setup.sourceContainingRegistry);
    if (result.setup.adoptedOuterRegistry !== 'unavailable') expect(result.setup.providerValidated).toBe(true);
    expect(result.beforeAppend).toMatchObject({document: true, connected: false, root: false, rendered: false});
    expect(['destination-global', 'unavailable']).toContain(result.beforeAppend.registry);
    expect(result.connectedCalls).toBe(1);
    expect(result.connectedBefore).toMatchObject({document: true, connected: true, exactContainingRoot: true, root: false});
    expect(result.sameChild).toBe(true);
    expect(result.sameParentRoot).toBe(true);
    expect(result.containingRootPreserved).toBe(true);
    expect(result.containingRegistryUnchanged).toBe(true);
    expect(result.counts.accessorReads).toBe(0);
    if (result.rejectionPathExercised) {
      expect(result.setup.adoptedContainingRegistry).toBe('source-global');
      expect(result.connectedBefore?.registry).toBe('source-global');
      expect(result.completed).toBe(false);
      expect(result.returnedRoots).toBe(0);
      expect(result.connectionError).not.toBeNull();
      expect(result.after).toMatchObject({document: true, root: false, rendered: false});
      if (mode === 'reentrant-move' || mode === 'reentrant-null-request') {
        expect(result.counts).toEqual({accessorReads: 0, providerCalls: 1, boundaryCalls: 1});
        expect(result.connectionError).toEqual({name: 'Error', message: 'The render context changed while resolving its containing root registry.', sameSentinel: false});
        expect(result.childInHoldingFragment).toBe(mode === 'reentrant-move');
        expect(result.requestedNull).toBe(mode === 'reentrant-null-request');
        if (mode === 'reentrant-move') expect(result.after.connected).toBe(false);
        else expect(result.hostAssociationUnchanged).toBe(true);
      } else if (mode === 'throwing-provider') {
        expect(result.counts).toEqual({accessorReads: 0, providerCalls: 0, boundaryCalls: 1});
        expect(result.connectionError).toEqual({name: 'Error', message: 'Parent proof provider sentinel', sameSentinel: true});
        expect(result.hostAssociationUnchanged).toBe(true);
      } else {
        expect(result.counts).toEqual({accessorReads: 0, providerCalls: mode === 'malformed-function' ? 1 : 0, boundaryCalls: mode === 'malformed-function' ? 1 : 0});
        expect(result.connectionError).toMatchObject({name: 'NotSupportedError', sameSentinel: false});
        expect(result.hostAssociationUnchanged).toBe(true);
      }
    } else {
      // Native association can already be current-global, or the registry API
      // can be absent. These outcomes do not exercise the foreign-root refusal.
      expect(['destination-global', 'unavailable']).toContain(result.connectedBefore?.registry);
      expect(result.completed).toBe(true);
      expect(result.returnedRoots).toBe(1);
      expect(result.connectionError).toBeNull();
      expect(result.counts).toEqual({accessorReads: 0, providerCalls: 0, boundaryCalls: 0});
      expect(result.after).toMatchObject({document: true, connected: true, root: true, rootDocument: true, rendered: true});
      expect(result.after.rootRegistry).toBe(result.connectedBefore?.registry);
      expect(result.hostAssociationUnchanged).toBe(true);
      expect(result.childInHoldingFragment).toBe(false);
      expect(result.requestedNull).toBe(false);
    }
  });
}
