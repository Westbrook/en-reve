import '@en-reve/tokens/default.css';
import '@en-reve/styles/foundations.css';
import '@en-reve/styles/controls.css';
import { EnButton } from '@en-reve/elements/button.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { activityStyles } from '@en-reve/styles/activity.js';
import { resolveTheme, emitThemeCSS, emitPropertyRegistrations } from '@en-reve/tokens';
class AggregateButton extends EnButton { static override styles = [foundationStyles, inlineHostStyles, controlStyles, activityStyles]; }
customElements.define('en-button', EnButton);
customElements.define('en-aggregate-button', AggregateButton);
Object.assign(window,{resolveTheme,emitThemeCSS,emitPropertyRegistrations});
document.body.dataset.ready='true';
