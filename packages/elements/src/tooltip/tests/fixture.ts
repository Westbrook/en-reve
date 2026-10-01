import { EnTooltip } from '../index.js';
import { EnToolbar } from '../../toolbar/index.js';
import { EnButton } from '../../button/index.js';
customElements.define('en-button', EnButton);
customElements.define('en-toolbar', EnToolbar);
customElements.define('en-tooltip', EnTooltip);

const shadow = document.querySelector('#shadow-fixture')!.attachShadow({ mode: 'open' });
shadow.innerHTML = `
	<style>button { width: 100px; height: 44px; } #tools { display: flex; gap: 24px; }</style>
	<div id="tools"><button id="one">Shadow one</button><button id="two">Shadow two</button></div>
	<en-tooltip id="tip-one" for="one" warmup-group="tools"><span slot="content">Shadow first</span></en-tooltip>
	<en-tooltip id="tip-two" for="two" warmup-group="tools"><span slot="content">Shadow second</span></en-tooltip>
`;
