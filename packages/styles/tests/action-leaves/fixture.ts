import '@en-reve/tokens/default.css';
import '@en-reve/styles/foundations.css';
import { EnButton } from '@en-reve/elements/button.js';
import { EnLink } from '@en-reve/elements/link.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { activityStyles } from '@en-reve/styles/activity.js';

class AggregateButton extends EnButton {
  static override styles = [foundationStyles, inlineHostStyles, controlStyles, activityStyles];
}
class AggregateLink extends EnLink {
  static override styles = [foundationStyles, inlineHostStyles, controlStyles];
}
customElements.define('en-button', EnButton);
customElements.define('en-link', EnLink);
customElements.define('en-aggregate-button-probe', AggregateButton);
customElements.define('en-aggregate-link-probe', AggregateLink);
document.body.dataset.ready = 'true';
