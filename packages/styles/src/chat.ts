import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t } from './internal/values.js';
export const chatStyles=sizedStyles(css`
 .en-chat-message,.en-chat-composer { min-inline-size:0;overflow-wrap:anywhere;padding:var(--en-chat-padding,${t('--en-space-panel')});border:${t('--en-border-width')} solid var(--en-chat-border-color,${t('--en-color-line')});border-radius:var(--en-chat-radius,${t('--en-radius-container')});color:var(--en-chat-color,${t('--en-color-text')});background:var(--en-chat-background,${t('--en-color-surface')}); }
 :host([outgoing]) .en-chat-message { background:var(--en-chat-outgoing-background,${t('--en-color-accent-subtle')}); }
 .en-chat-message__header,.en-chat-actions { display:flex;flex-wrap:wrap;align-items:center;gap:0 ${t('--en-space-actions')};min-inline-size:0; }
 .en-chat-message__author { font-weight:${t('--en-font-heading-small-weight')}; }
 .en-chat-message__content { margin-block-start:${t('--en-space-2')}; }
 .en-chat-message__metadata { color:${t('--en-color-text-muted')}; }
 slot { display:contents; }
 ::slotted(*) { max-inline-size:100%; }
 ::slotted([slot='attachments']),::slotted([slot='actions']),::slotted([slot='status']) { margin-block-start:${t('--en-space-3')}; }
 ::slotted([slot='status']) { display:block; }
 .en-chat-composer__editor { min-inline-size:0; }
 .en-chat-composer__editor ::slotted(*) { display:block;inline-size:100%;box-sizing:border-box; }
 .en-chat-composer__actions { margin-block-start:${t('--en-space-3')}; }
 .en-chat-composer__send { margin-inline-start:auto; }
`);
