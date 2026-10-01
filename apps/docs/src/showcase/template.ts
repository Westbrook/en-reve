import { html, nothing, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { copyTokenReference } from '../token-copy.js';
import { emptyStateTemplate, metadataListTemplate } from '@en-reve/primitives/templates/content.js';
import { activity, commands, people, type CardId } from './model.js';
import type { ShowcaseApp } from './app.js';

function card(app: ShowcaseApp, id: CardId, title: string, body: TemplateResult, reset = true) {
	return html`<section id=${`showcase-${id}`} class="showcase-card" aria-labelledby=${`showcase-heading-${id}`}>
		<en-card>
			<div slot="header" class="showcase-card-heading"><h2 id=${`showcase-heading-${id}`}>${title}</h2>
				${reset ? html`<en-button data-en-action="reset" variant="ghost" size="small" @click=${() => app.reset(id)}><span class="showcase-reset-label">Reset<span class="showcase-sr-only"> ${title}</span></span></en-button>` : nothing}
			</div>
			${keyed(app.resets.get(id) ?? 0, html`<div class="showcase-card-body">${body}</div>`)}
		</en-card>
	</section>`;
}

function canvas(app: ShowcaseApp, large = false) {
	return html`<div class=${`showcase-art${large ? ' showcase-art-large' : ''}`} data-layout=${app.data.canvas} role="img" aria-label=${`${app.data.canvas} composition with overlapping shapes`}>
		<div class="showcase-artboard" style=${styleMap({ opacity: String(app.data.opacity / 100) })}><i></i><b></b><span>Make room<br>for a new idea.</span></div>
	</div>`;
}

function actions(app: ShowcaseApp) {
	return card(app, 'actions', 'Make something.', html`
		<div class="showcase-row"><en-button id="showcase-create-trigger">Create <en-icon slot="suffix" name="arrow-right"></en-icon></en-button>
			<en-button variant="secondary" @click=${() => app.open('showcase-preview-dialog')}>Preview</en-button>
			<en-button variant="ghost" icon-only @click=${() => app.setLayout('reset-canvas')}><en-icon slot="prefix" name="sparkles"></en-icon><span slot="label">Reset canvas</span></en-button>
		</div>
		<en-text-field label="Study name" class="showcase-visually-labeled" placeholder="Name your next idea"></en-text-field>
		<en-textarea label="Quick note" class="showcase-visually-labeled" placeholder="Leave a note for your future self…" rows="2"></en-textarea>
		<div class="showcase-row"><en-badge variant="accent">In progress</en-badge><en-badge>Local draft</en-badge><en-switch checked>Sync</en-switch></div>
		<en-toolbar label="Canvas orientation"><en-button variant="secondary" @click=${() => app.setLayout('portrait')}>Portrait</en-button><en-button variant="secondary" @click=${() => app.setLayout('landscape')}>Landscape</en-button></en-toolbar>
		<div class="showcase-row"><en-button id="showcase-menu-trigger" variant="ghost">Actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button><en-button id="showcase-palette-trigger" variant="ghost">All commands</en-button></div>
		<p class="showcase-status" role="status">Canvas: ${app.data.canvas}.</p>
		<en-menu for="showcase-menu-trigger" label="Canvas actions" @en-action=${(event: Event) => app.command(event)}>${commands.map(command => html`<en-menu-item action=${command.action}>${command.label}</en-menu-item>`)}</en-menu>
		<en-command-palette id="showcase-palette" for="showcase-palette-trigger" label="Studio commands" search-label="Find a layout command" .commands=${commands} @en-action=${(event: Event) => app.command(event)}></en-command-palette>
		<en-dialog for="showcase-create-trigger" id="showcase-create-dialog" label="Start with a direction"><p>Choose a canvas for this local study. You can change it at any time.</p><div slot="footer" class="showcase-row"><en-button variant="secondary" @click=${() => { app.setLayout('portrait'); app.close('showcase-create-dialog'); }}>Portrait</en-button><en-button @click=${() => { app.setLayout('landscape'); app.close('showcase-create-dialog'); }}>Landscape</en-button></div></en-dialog>
	`);
}

function navigation(app: ShowcaseApp) {
	return card(app, 'navigation', 'Around the studio', html`
		<en-breadcrumbs label="Current study path"><a href="#showcase-navigation">Studio</a><a href="#showcase-project">Projects</a><span aria-current="page">New study</span></en-breadcrumbs>
		<div class="showcase-nav-pair">
			<en-navigation label="Planning"><a href="#showcase-project">Projects</a><a href="#showcase-activity">Activity</a><a href="#showcase-readiness">Reviews</a><a href="#showcase-library">Library</a></en-navigation>
			<en-navigation label="Workspace"><a href="#showcase-team">People</a><a href="#showcase-brand">Brand kit</a><a href="#showcase-access">Access</a><a href="#showcase-notifications">Notifications</a></en-navigation>
		</div>
	`, false);
}

function brief(app: ShowcaseApp) {
	return card(app, 'brief', 'A little direction', html`
		<en-tabs label="Creative brief" value="idea">
			<en-tab slot="tab" value="idea">The idea</en-tab><en-tab slot="tab" value="delivery">Delivery</en-tab>
			<en-tab-panel slot="panel" value="idea"><p>A quieter workspace for a brighter idea. Start with a strong shape, an honest headline, and room to breathe.</p><en-checkbox checked>Keep the headline editable</en-checkbox></en-tab-panel>
			<en-tab-panel slot="panel" value="delivery"><en-radio-group label="Export quality" value="review"><en-radio value="review">Review quality</en-radio><en-radio value="final">Final artwork</en-radio></en-radio-group></en-tab-panel>
		</en-tabs>
		<en-accordion><en-accordion-item value="review-guidance"><span slot="label">What makes a useful review?</span><p>Try one task, note where you hesitate, and share the result with your team.</p></en-accordion-item></en-accordion>
	`);
}

function brand(app: ShowcaseApp) {
	return card(app, 'brand', 'Small palette. Big possibility.', html`
		<div class="showcase-swatches">${[['Brand', '--en-color-brand'], ['Action', '--en-color-action'], ['Surface', '--en-color-surface-subtle']].map(([label, token]) => html`<div data-token-sample><en-swatch label=${`Copy ${label.toLowerCase()} color CSS reference`} token=${token} @en-action=${copyTokenReference}></en-swatch><span>${label}</span><small role="status"></small></div>`)}</div>
		<p>These three swatches follow the page theme.</p>
		<div class="showcase-color-preview" style=${styleMap({ '--study-accent': app.data.accent })}><span>Studio / 04</span><strong>Color outside<br>the expected.</strong></div>
		<en-color-field label="Study color" value="#6d5ce7" @en-change=${(event: Event) => app.change<string>(event, host => host.value, accent => app.patch({ accent }))}></en-color-field>
		<p class="showcase-caption">Study color changes this artwork only.</p>
	`);
}

function activityCard(app: ShowcaseApp) {
	const rows = activity[app.data.activityRange];
	const maximum = Math.max(...rows.map(row => row.value));
	return card(app, 'activity', 'Creative momentum', html`
		<p>A few small steps, every day.</p>
		<en-segmented-control label="Activity period" value="week" @en-change=${(event: Event) => app.change<string>(event, host => host.value, value => app.patch({ activityRange: value === 'month' ? 'month' : 'week' }))}><en-segmented-item value="week">This week</en-segmented-item><en-segmented-item value="month">Six months</en-segmented-item></en-segmented-control>
		<figure class="showcase-chart"><div class="showcase-bars" aria-hidden="true">${rows.map(row => html`<div><div class="showcase-bar" style=${styleMap({ '--bar-size': `${row.value / maximum * 100}%` })}></div><span>${row.label}</span></div>`)}</div><figcaption>Contributions to studio projects · sample data</figcaption></figure>
		<details><summary>View activity data</summary><table><caption>Contributions per period</caption><thead><tr><th scope="col">Period</th><th scope="col">Contributions</th></tr></thead><tbody>${rows.map(row => html`<tr><th scope="row">${row.label}</th><td>${row.value}</td></tr>`)}</tbody></table></details>
		<div class="showcase-summary-pair"><div><span>Total contributions</span><strong>${rows.reduce((sum, row) => sum + row.value, 0)}</strong></div><div><span>Next review</span><strong>Friday</strong></div></div>
		<a class="en-link" href=${app.href('/workflows/assets')}>Explore the asset workflow <span aria-hidden="true">↗</span></a>
	`);
}

function readiness(app: ShowcaseApp) {
	const count = app.data.ready.filter(Boolean).length;
	return card(app, 'readiness', 'Ready for a first impression', html`
		<div class="showcase-metric"><strong>${count}<span> / 4</span></strong><en-badge variant=${app.data.approved ? 'success' : 'accent'}>${app.data.approved ? 'Approved' : 'In review'}</en-badge></div>
		<en-progress-bar label="Review checklist" .value=${count} max="4"></en-progress-bar>
		<div class="showcase-checklist">${['The story is clear', 'The layout responds', 'Keyboard review complete', 'Alternative text checked'].map((label, index) => html`<en-checkbox .checked=${app.data.ready[index]} @en-change=${(event: Event) => app.change<boolean>(event, host => host.checked, checked => app.patch({ ready: app.data.ready.map((value, i) => i === index ? checked : value), approved: false }))}>${label}</en-checkbox>`)}</div>
		<en-button id="showcase-approve-trigger" ?disabled=${count !== 4 || app.data.approved}>Approve study</en-button>
		<en-dialog for="showcase-approve-trigger" id="showcase-approve-dialog" label="Ready to approve?"><p>This marks the sample study as approved in this page only.</p><div slot="footer" class="showcase-row"><en-button variant="ghost" @click=${() => app.close('showcase-approve-dialog')}>Keep reviewing</en-button><en-button @click=${() => app.approve()}>Confirm approval</en-button></div></en-dialog>
	`);
}

function asset(app: ShowcaseApp) {
	return card(app, 'asset', 'One idea, many possibilities', html`
		${canvas(app)}
		${metadataListTemplate({ items: [{ label: 'Study', value: 'Shape & space' }, { label: 'Format', value: 'Editable composition' }, { label: 'Owner', value: 'Mira Chen' }] })}
		<div class="showcase-row"><en-button @click=${() => app.open('showcase-preview-dialog')}>Preview study</en-button><en-button id="showcase-asset-info" icon-only variant="ghost"><en-icon slot="prefix" name="info"></en-icon><span slot="label">About this study</span></en-button></div>
		<en-popover for="showcase-asset-info" label="About this study"><p>This editable composition uses the active theme’s colors. Change its orientation in “Make something” and its opacity in “Every little detail.”</p></en-popover>
		<en-dialog id="showcase-preview-dialog" label="Shape & space">${canvas(app, true)}<p>Canvas: ${app.data.canvas}. Opacity: ${app.data.opacity}%.</p><en-button slot="footer" @click=${() => app.close('showcase-preview-dialog')}>Back to the studio</en-button></en-dialog>
	`, false);
}

function feedback(app: ShowcaseApp) {
	return card(app, 'feedback', 'What’s your first impression?', html`
		<en-rating id="feedback-rating" label="Study rating" value="4" max="5"></en-rating>
		<en-textarea id="feedback-note" label="Review note" placeholder="What’s working? What could be clearer?" rows="3" required></en-textarea>
		<en-button variant="secondary" @click=${() => { if (app.valid('feedback-note')) app.patch({ feedback: `${app.value('feedback-rating')} / 5 — ${app.value('feedback-note')}` }); }}>Add review</en-button>
		<p class="showcase-status" role="status">${app.data.feedback}</p>
	`);
}

function project(app: ShowcaseApp) {
	return card(app, 'project', 'Set your next milestone', html`
		<p>Give an idea a name, a team, and a little momentum.</p>
		<form @submit=${(event: Event) => { event.preventDefault(); app.createProject(); }}>
			<en-text-field id="project-title" label="Project name" placeholder="A fresh perspective" required></en-text-field>
			<div class="showcase-field-pair"><en-select id="project-kind" label="Project type" value="campaign"><en-select-option value="campaign">Campaign</en-select-option><en-select-option value="identity">Identity</en-select-option><en-select-option value="product">Product</en-select-option></en-select><en-date-picker id="project-date" label="Review date" value="2026-09-18" today="2026-09-14" required></en-date-picker></div>
			<en-button @click=${() => app.createProject()}>Create project</en-button>
		</form>
		<p class="showcase-status" role="status">${app.data.projectStatus}</p>
	`);
}

function output(app: ShowcaseApp) {
	return card(app, 'output', 'Every little detail', html`
		<p>Shape the output to fit the idea.</p>
		<en-select label="Export format" value="png"><en-select-option value="png">PNG · Raster image</en-select-option><en-select-option value="svg">SVG · Vector image</en-select-option><en-select-option value="pdf">PDF · Document</en-select-option></en-select>
		<en-slider label="Artwork opacity" .value=${app.data.opacity} min="0" max="100" step="1" editable @en-change=${(event: Event) => app.change<number>(event, host => Number(host.value), opacity => app.patch({ opacity }))}></en-slider>
		<en-number-field label="Export scale" .value=${String(app.data.scale)} min="25" max="400" step="25" @en-change=${(event: Event) => app.change<string>(event, host => host.value, scale => app.patch({ scale: Number(scale) }))}></en-number-field>
		<en-checkbox checked>Include transparent background</en-checkbox>
		<en-textarea label="Export notes" placeholder="Anything the next person should know?" rows="3"></en-textarea>
		<en-button id="showcase-output-trigger" variant="ghost">More export options<en-icon slot="suffix" name="chevron-down"></en-icon></en-button>
		<en-drawer for="showcase-output-trigger" id="showcase-output-drawer" label="Export options" presentation="responsive"><en-stack><en-checkbox checked>Keep layer names</en-checkbox><en-checkbox>Include review notes</en-checkbox><en-textarea label="Handoff message" rows="3"></en-textarea></en-stack><en-button slot="footer" @click=${() => app.close('showcase-output-drawer')}>Done</en-button></en-drawer>
		<div class="showcase-summary-pair"><div><span>Opacity</span><strong>${app.data.opacity}%</strong></div><div><span>Scale</span><strong>${app.data.scale}%</strong></div></div>
	`);
}

function access(app: ShowcaseApp) {
	return card(app, 'access', 'Your own corner of the studio', html`
		<en-text-field id="access-email" label="Work email" type="email" autocomplete="email" pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+" placeholder="you@studio.com" required></en-text-field>
		<en-text-field id="access-password" label="Password" type="password" autocomplete="new-password" minlength="8" description="At least 8 characters. Use a sample password here." required></en-text-field>
		<en-switch>Remember this device</en-switch>
		<en-button variant="secondary" @click=${() => app.saveAccess()}>Check details</en-button>
		<p class="showcase-status" role="status">${app.data.accessStatus}</p>
	`);
}

function notifications(app: ShowcaseApp) {
	return card(app, 'notifications', 'Keep the useful signals', html`
		<en-switch id="notify-mentions" checked>Mentions and replies</en-switch><en-switch id="notify-reviews" checked>New review requests</en-switch><en-switch id="notify-digest">Weekly studio digest</en-switch>
		<en-button variant="secondary" @click=${() => app.patch({ notificationStatus: `Saved locally: ${['mentions', 'reviews', 'digest'].filter(id => app.field(`notify-${id}`).checked).join(', ') || 'all notifications off'}.` })}>Save preferences</en-button>
		<p class="showcase-status" role="status">${app.data.notificationStatus}</p>
	`);
}

function team(app: ShowcaseApp) {
	return card(app, 'team', 'Better, together.', html`
		<p>A small team with room for another perspective.</p>
		<ul class="showcase-people">${repeat(app.data.members, name => name, (name, index) => html`<li><en-avatar name=${name}></en-avatar><div><strong>${name}</strong><span>${index === 0 ? 'Designer · Owner' : 'Collaborator'}</span></div><en-badge>${index === 0 ? 'You' : 'Member'}</en-badge></li>`)}</ul>
		<en-combobox id="team-person" label="Add a teammate" placeholder="Search people…" .items=${people}></en-combobox>
		<en-select id="team-role" label="Access level" value="editor"><en-select-option value="editor">Editor</en-select-option><en-select-option value="reviewer">Reviewer</en-select-option><en-select-option value="viewer">Viewer</en-select-option></en-select>
		<en-button data-en-action="standalone" @click=${() => app.invite()}>Add to demo team<en-icon slot="suffix" name="plus"></en-icon></en-button>
		<p class="showcase-status" role="status">${app.data.invitationStatus}</p>
	`);
}

function chat(app: ShowcaseApp) {
	return card(app, 'chat', 'A thought to get you started', html`
		${app.data.messages.length ? html`<ol class="showcase-messages" aria-label="Sample conversation">${repeat(app.data.messages, message => message.id, message => html`<li data-who=${message.who}><strong>${message.who}</strong><p>${message.text}</p></li>`)}</ol>` : html`<div class="showcase-chat-welcome"><en-icon name="sparkles" size="large"></en-icon><h3>What are we making today?</h3><p>A rough idea is a good place to start.</p></div>`}
		<en-textarea id="chat-message" label="Message" class="showcase-visually-labeled" placeholder="I’m exploring a new direction…" rows="3"></en-textarea>
		<div class="showcase-row showcase-between"><span class="showcase-caption">Local sample response · no AI connection</span><en-button @click=${() => app.sendMessage()}>Send<en-icon slot="suffix" name="arrow-right"></en-icon></en-button></div>
		<p class="showcase-status" role="status">${app.data.chatStatus}</p>
	`);
}

function share(app: ShowcaseApp) {
	return card(app, 'share', 'Bring another screen', html`
		<div class="showcase-share-art" aria-hidden="true"><en-icon name="arrow-right" size="large"></en-icon></div>
		<p>Open this showcase on another screen to compare the layout.</p>
		<a href=${app.href('/showcase')}>Open showcase</a>
		<en-button variant="secondary" @click=${() => app.copyLink()}>Copy showcase link</en-button>
		<p class="showcase-caption">A localhost address opens only on the computer running this preview.</p>
		<p class="showcase-status" role="status">${app.data.shareStatus}</p>
	`);
}

function library(app: ShowcaseApp) {
	return card(app, 'library', 'A place for what’s next', html`
		${app.data.inserted ? html`<div class="showcase-row"><en-icon name="sparkles" size="large"></en-icon><div><h3>First spark</h3><p>Your sample asset is in the collection.</p></div><en-badge variant="success">1 asset</en-badge></div>` : emptyStateTemplate({ title: html`<h3>No assets yet</h3>`, description: 'Every collection starts with one good find.', actions: html`<en-button variant="secondary" @click=${() => app.patch({ inserted: true })}>Add a sample asset</en-button>` })}
		<en-button id="showcase-library-help" variant="ghost">How this collection works<en-icon slot="suffix" name="chevron-down"></en-icon></en-button>
		<en-popover for="showcase-library-help" label="About the collection"><p>Add an authored sample asset to this page. Use Reset to empty the collection again.</p><en-checkbox checked>Keep the source editable</en-checkbox></en-popover>
	`);
}

/** Explicit columns preserve visual, reading and keyboard order at every breakpoint. */
export function showcaseGrid(app: ShowcaseApp) {
	return html`<div class="showcase-grid">
		<div class="showcase-column">${actions(app)}${navigation(app)}${brief(app)}${brand(app)}</div>
		<div class="showcase-column">${activityCard(app)}${readiness(app)}${asset(app)}${feedback(app)}</div>
		<div class="showcase-column">${project(app)}${output(app)}${access(app)}${notifications(app)}</div>
		<div class="showcase-column">${team(app)}${chat(app)}${share(app)}${library(app)}</div>
	</div>`;
}

export function scopeTemplate() {
	return html`<section id="scope-gaps" class="showcase-scope" aria-labelledby="scope-heading">
		<h2 id="scope-heading">What’s missing?</h2>
		<p>This page composes the library’s existing elements and native content recipes. The following dedicated patterns are neither implemented nor explicitly included in the current 72-pattern plan. They are discussion candidates.</p>
		<div class="showcase-gap-grid">
			<div><h3>Visible in the reference</h3><dl><dt><a href="https://ui.shadcn.com/docs/components/chart">Charts and data visualization</a></dt><dd>Reusable scales, series, legends, value inspection, and accessible data alternatives. The activity bars above are an authored figure with a data table, not a library chart component.</dd><dt>QR-code display and generation</dt><dd>A real encoder and text/link alternative for device handoff. This page uses an ordinary copyable link.</dd></dl></div>
			<div><h3>Elsewhere in the component catalog</h3><dl><dt><a href="https://ui.shadcn.com/docs/components/input-otp">OTP / PIN entry</a></dt><dd>Coordinated code entry with paste and autofill behavior.</dd><dt><a href="https://ui.shadcn.com/docs/components/hover-card">Hover-preview card</a></dt><dd>A defined hover and focus lifecycle for rich supplementary content.</dd><dt><a href="https://ui.shadcn.com/docs/components/scroll-area">Custom scroll area</a></dt><dd>A dedicated scrollbar presentation. Native scrolling already works throughout the library.</dd></dl></div>
		</div>
		<details><summary>Already planned, or covered by composition</summary><p>Custom calendars/date pickers, tables, pagination, carousel, upload, toast, tree, rich text, progress steps, nested navigation, menu submenus and checkable items, and richer chat/composer patterns remain in the plan. The existing native date input can be used now. Cards, metadata, dividers, keyboard-key labels, and simple layout do not require separate custom elements.</p><p>The current icon catalog is small; the page uses its existing glyphs. This audit compares the implementation, current Markdown plans, and 72-pattern inventory with the <a href="https://ui.shadcn.com/">shadcn/ui reference</a>. No new pattern commitment is implied.</p></details>
	</section>`;
}
