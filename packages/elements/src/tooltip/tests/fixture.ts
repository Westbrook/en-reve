import { EnTooltip } from '../index.js';
import { EnToolbar } from '../../toolbar/index.js';
import { EnButton } from '../../button/index.js';
import { ContextProvider, tooltipWarmupContext, createTooltipWarmupGroup, type TooltipWarmupGroup } from '../../context.js';
customElements.define('en-button', EnButton);
customElements.define('en-toolbar', EnToolbar);
customElements.define('en-tooltip', EnTooltip);

const warmupScopes = new Map<string, TooltipWarmupGroup>();
const warmupProviders = new Map<string, ContextProvider<typeof tooltipWarmupContext>>();
Object.assign(window, { tooltipContextHarness: {
  provide(selector: string, id: string | null) {
    let group = id === null ? undefined : warmupScopes.get(id);
    if (id !== null && !group) warmupScopes.set(id, group = createTooltipWarmupGroup());
    const provider = warmupProviders.get(selector);
    if (provider) provider.setValue(group);
    else warmupProviders.set(selector, new ContextProvider(document.querySelector<HTMLElement>(selector)!, {context: tooltipWarmupContext, initialValue: group}));
  },
} });

const shadow = document.querySelector('#shadow-fixture')!.attachShadow({ mode: 'open' });
shadow.innerHTML = `
	<style>button { width: 100px; height: 44px; } #tools { display: flex; gap: 24px; }</style>
	<div id="tools"><button id="one">Shadow one</button><button id="two">Shadow two</button></div>
	<en-tooltip id="tip-one" for="one" warmup-group="tools"><span slot="content">Shadow first</span></en-tooltip>
	<en-tooltip id="tip-two" for="two" warmup-group="tools"><span slot="content">Shadow second</span></en-tooltip>
`;
