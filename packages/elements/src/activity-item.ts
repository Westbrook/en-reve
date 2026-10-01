import {html,nothing} from 'lit';
import {EnElement} from './internal/en-element.js';
import {foundationStyles,blockHostStyles} from '@en-reve/styles/foundations.js';
import {collaborationStyles} from '@en-reve/styles/collaboration.js';
/**
 * Authored activity content, retaining interactive children and their native semantics.
 * @tagname en-activity-item
 * @slot - Activity description or rich body.
 * @slot author - Visible author, replacing author.
 * @slot avatar - Decorative author avatar.
 * @slot metadata - Authored context; replaces the entire datetime/timeLabel timestamp fallback.
 * @slot attachments - Authored previews/files.
 * @slot actions - Named contextual controls.
 * @csspart item - List-item wrapper.
 * @csspart base - Named article surface.
 * @csspart header - Author and timestamp row.
 * @csspart author - Visible author.
 * @csspart metadata - Generic authored context container.
 * @csspart time - Native timestamp fallback; applies only when metadata has no assigned content.
 * @csspart content - Activity body.
 * @csspart attachments - Attachment slot container.
 * @csspart actions - Contextual action container.
 * @cssprop --en-activity-background - Entry fill.
 * @cssprop --en-activity-border-color - Entry boundary.
 * @cssprop --en-activity-radius - Entry corners.
 * @cssprop --en-activity-padding - Entry interior spacing.
 */
export class EnActivityItem extends EnElement{
 static override properties={author:{},label:{},datetime:{},timeLabel:{attribute:'time-label'},embedded:{type:Boolean}};
 static override styles=[foundationStyles,blockHostStyles,collaborationStyles];
 /** Omit the internal listitem role when the item is already inside an owned listitem. */ declare embedded:boolean;
 /** Visible fallback author. */ declare author:string;
 /** Optional concise article name; use a distinct action summary. */ declare label:string;
 /** Machine-readable ISO timestamp; no time zone or relative-time inference. */ declare datetime:string;
 /** Application-formatted visible time, localized including time zone where relevant. */ declare timeLabel:string;
 constructor(){super();this.embedded=false;this.author='';this.label='';this.datetime='';this.timeLabel='';}
 /** Explicitly focus the article without adding every entry to the Tab order. */
 override focus(options?:FocusOptions){this.renderRoot.querySelector<HTMLElement>('article')?.focus(options);}
 protected override render(){return html`<div role=${this.embedded?nothing:'listitem'} part="item"><article class="item" part="base" tabindex="-1" aria-label=${this.label||nothing}>
  <header part="header"><span aria-hidden="true"><slot name="avatar"></slot></span><span class="author" part="author"><slot name="author">${this.author||nothing}</slot></span><span part="metadata"><slot name="metadata"><time part="time" datetime=${this.datetime||nothing}>${this.timeLabel||nothing}</time></slot></span></header>
  <div class="body" part="content"><slot></slot></div><div class="extra" part="attachments"><slot name="attachments"></slot></div><div class="extra" part="actions"><slot name="actions"></slot></div>
 </article></div>`;}
}
declare global{interface HTMLElementTagNameMap{'en-activity-item':EnActivityItem;}}
