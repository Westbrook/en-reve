import { EnButton } from './index.js';
import { EnLink } from '../link/index.js';
import { EnCard } from '../card/index.js';
import { EnAlert } from '../alert/index.js';
import { EnAvatar } from '../avatar/index.js';
import { EnProgressBar } from '../progress-bar/index.js';
import { EnIcon } from '../icon/index.js';
import { EnBadge } from '../badge/index.js';

customElements.define('en-button', EnButton);
customElements.define('en-link', EnLink);
customElements.define('en-card', EnCard);
customElements.define('en-alert', EnAlert);
customElements.define('en-avatar', EnAvatar);
customElements.define('en-progress-bar', EnProgressBar);
customElements.define('en-icon', EnIcon);
customElements.define('en-badge', EnBadge);
document.body.dataset.ready = 'true';
