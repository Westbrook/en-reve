import type { PropertyValues } from 'lit';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { commandPaletteStyles } from '@en-reve/styles/commands.js';
import { EnDialog } from '../dialog/dialog.js';
import { dialogTemplate } from '../dialog/template.js';
import { createCommandPaletteModel, type CommandPaletteCommand } from './model.js';
import { commandPaletteTemplate } from './template.js';
import { CommandPaletteInteractionController } from './interaction-controller.js';
import { CommandPaletteViewportController } from './viewport-controller.js';
export type { CommandPaletteCommand } from './model.js';

/**
 * A modal search surface for a finite catalog of application-owned commands.
 * Candidate selection is temporary and never a form value or executed command.
 * @cssprop --en-duration-enter - Optional native surface entry paint duration (0–500ms).
 * @cssprop --en-duration-exit - Optional native surface exit paint duration (0–500ms); never delays state or focus.
 * @cssprop --en-ease-enter - Native surface entry easing.
 * @cssprop --en-ease-exit - Native surface exit easing.
 * @cssprop --en-motion-surface-offset - Optional modal travel, constrained to 0–8px.
 * @cssprop --en-motion-surface-scale - Optional modal scale, constrained to .95–1.
 * @tagname en-command-palette
 * @cssprop --en-option-focus-width - Immediate primary focus contour width.
 * @cssprop --en-option-focus-color - Immediate primary focus contour color.
 * @cssprop --en-option-focus-offset - Signed primary focus contour offset.
 * @cssprop --en-option-focus-halo-width - Supplemental outer focus halo width.
 * @cssprop --en-option-focus-halo-color - Supplemental focus halo color; alpha is supported.
 * @cssprop --en-overlay-focus-width - Immediate primary focus contour width.
 * @cssprop --en-overlay-focus-color - Immediate primary focus contour color.
 * @cssprop --en-overlay-focus-offset - Signed primary focus contour offset.
 * @cssprop --en-overlay-focus-halo-width - Supplemental outer focus halo width.
 * @cssprop --en-overlay-focus-halo-color - Supplemental focus halo color; alpha is supported.
 * @slot label - Noninteractive dialog heading; falls back to label.
 * @slot - Optional supporting flow content after the search results; not result templates.
 * @slot footer - Optional authored actions after the body, in reading order.
 * @csspart control - Native search input, with same-root combobox relationships.
 * @csspart focus-frame - Noninteractive search-input frame supporting the supplemental focus accent.
 * @csspart listbox - Scrollable command candidates.
 * @csspart option - A plain-text command candidate; aria-selected is temporary navigation state.
 * @csspart status - Persistent polite empty-results message, outside the listbox.
 * @cssprop --en-option-list-background - Result-region fill; independent of the modal shell.
 * @cssprop --en-option-list-color - Result-region foreground.
 * @cssprop --en-option-list-radius - Result-region corners.
 * @cssprop --en-option-list-padding - Result-region inset.
 * @cssprop --en-option-list-gap - Space between result rows.
 * @cssprop --en-option-list-max-block-size - Results height ceiling, also constrained by the visual viewport.
 * @cssprop --en-option-background - Broad command row fill fallback.
 * @cssprop --en-option-color - Broad command row foreground fallback.
 * @cssprop --en-option-rest-background - Ordinary row fill.
 * @cssprop --en-option-rest-color - Ordinary row text.
 * @cssprop --en-option-hover-background - Hovered row fill.
 * @cssprop --en-option-hover-color - Hovered row text.
 * @cssprop --en-option-active-background - Current keyboard candidate fill.
 * @cssprop --en-option-active-color - Current keyboard candidate text.
 * @cssprop --en-option-pressed-background - Pressed row fill.
 * @cssprop --en-option-pressed-color - Pressed row text.
 * @cssprop --en-option-disabled-background - Unavailable row fill.
 * @cssprop --en-option-disabled-color - Unavailable row text.
 * @cssprop --en-option-inline-padding - Command inline inset.
 * @cssprop --en-option-block-padding - Command block inset.
 * @cssprop --en-option-radius - Command row corners.
 * @cssprop --en-option-font-weight - Command label weight.
 * @cssprop --en-input-background - Search input fill.
 * @cssprop --en-input-color - Search input foreground.
 * @cssprop --en-input-inline-padding - Search input inline inset.
 * @cssprop --en-input-focus-width - Width of the immediate input-family focus contour.
 * @cssprop --en-input-focus-color - Color of the immediate input-family focus contour.
 * @cssprop --en-input-focus-offset - Offset of the immediate input-family focus contour.
 * @cssprop --en-input-focus-halo-width - Width of the supplemental input-family focus halo.
 * @cssprop --en-input-focus-halo-color - Color of the supplemental input-family focus halo.
 * @cssprop --en-input-focus-accent-width - Thickness of the optional bottom focus accent on the field frame.
 * @cssprop --en-input-focus-accent-color - Color of the optional bottom focus accent on the field frame.
 * @cssprop --en-duration-focus-enter - Entry duration for supplemental focus decoration; the focus contour appears immediately.
 * @cssprop --en-duration-focus-exit - Exit duration for supplemental focus decoration.
 * @cssprop --en-ease-focus-enter - Entry easing for supplemental focus decoration.
 * @cssprop --en-ease-focus-exit - Exit easing for supplemental focus decoration.
 * @fires {import('../events.js').CommandActionEvent} en-action - Cancelable command intent: {action, data: undefined}; not completion.
 * @fires {import('../dialog/types.js').OverlayChangeEvent} en-change - Cancelable tentative boolean open state: {previous, proposed, reason}.
 */
export class EnCommandPalette extends EnDialog {
	static override properties = {
		...EnDialog.properties,
		commands: { attribute: false, noAccessor: true },
		searchLabel: { type: String, attribute: 'search-label' , useDefault: true},
		placeholder: { type: String , useDefault: true},
		emptyText: { type: String, attribute: 'empty-text' },
	};
	static override styles = [...EnDialog.styles, commandPaletteStyles];

	#model = createCommandPaletteModel();
	#signals = new SignalController(this, () => this.#model.view.get());
	#interaction = new CommandPaletteInteractionController({
		input: () => this.input, open: () => this.open && Boolean(this.dialog?.open),
		query: value => { this.#model.setQuery(value); this.scrollCandidate(); },
		move: direction => { this.#model.move(direction); this.scrollCandidate(); },
		active: () => this.#model.view.get().active?.action,
		execute: action => this.execute(action),
	});
	#viewport = new CommandPaletteViewportController(this, () => this.dialog);
	#shown = false;
	#initializedInput = false;

	/** Unique action IDs and plain searchable labels. Assign a new array to replace the catalog. */
	get commands(): readonly CommandPaletteCommand[] { return this.#model.commands.get(); }
	set commands(value: readonly CommandPaletteCommand[]) {
		const previous = this.commands;
		this.#model.setCommands(value);
		this.requestUpdate('commands', previous);
		if (this.isConnected && this.open) this.scrollCandidate();
	}
	/** Visible accessible label for the search input. */
	declare searchLabel: string;
	/** Optional search hint; the visible search label remains the accessible name. */
	declare placeholder: string;
	/** Localized text when filtering leaves no matching commands. */
	declare emptyText: string;

	constructor() {
		super();
		this.label = 'Commands'; this.searchLabel = 'Search commands';
		this.placeholder = ''; this.emptyText = 'No matching commands.';
	}
	private get input(): HTMLInputElement | null { return this.renderRoot?.querySelector<HTMLInputElement>('#en-command-search') ?? null; }

	protected override get triggerToggles(): boolean { return true; }

	protected override willUpdate(changes: PropertyValues): void {
		super.willUpdate(changes);
		// Finish an accepted close (including focus restoration) before rendering
		// collapsed combobox ARIA or resetting the formerly focused editor.
		// Opening still waits for the rendered content in updated().
		if (!this.open && this.dialog?.open) this.syncDialog();
	}

	protected override firstUpdated(changes: PropertyValues): void {
		super.firstUpdated(changes);
		// Hydration claims the server attributes without committing them. Follow
		// that matching first projection with the current authoritative open state.
		if ((this.input?.getAttribute('aria-expanded') === 'true') !== this.open) this.requestUpdate();
	}

	protected override syncDialog(): void {
		// Native autofocus must observe expanded combobox semantics. Closing still
		// completes before its collapsed ARIA projection in willUpdate().
		if (this.open && this.input?.getAttribute('aria-expanded') !== 'true') return;
		super.syncDialog();
		const shown = Boolean(this.dialog?.open);
		if (this.#shown && !shown) { this.#model.reset(); this.#interaction.reset(); }
		this.#shown = shown;
		this.#viewport.sync();
	}
	protected override updated(changes: PropertyValues): void {
		super.updated(changes);
		// Read, never replace, a native editor retained by hydration.
		if (!this.#initializedInput && this.input) {
			this.#initializedInput = true;
			if (this.input.value) this.#model.setQuery(this.input.value);
		}
	}
	override disconnectedCallback(): void {
		this.#interaction.disconnect(); this.#shown = false;
		super.disconnectedCallback();
	}
	private execute(action: string): void {
		if (!this.open || !this.dialog?.open || this.#interaction.composing || !this.isConnected) return;
		const candidate = this.#model.view.get().commands.find(command => command.action === action && !command.disabled);
		if (!candidate) return;
		this.#model.activate(action);
		const revision = this.openRevision;
		const allowed = dispatchAction(this, { action, data: undefined }, { cancelable: true });
		// Full dispatch is over. Equal author writes and nested accepted transitions own dismissal.
		if (allowed && this.isConnected && this.open && revision === this.openRevision
			&& this.commands.some(command => command.action === action && !command.disabled)) this.hide('action');
	}
	private scrollCandidate(): void {
		const action = this.#model.view.get().active?.action;
		void this.updateComplete.then(() => {
			if (!this.isConnected || !this.open || action !== this.#model.view.get().active?.action) return;
			const id = this.#model.view.get().active?.id;
			const option = id ? this.renderRoot.querySelector<HTMLElement>(`[id="${id}"]`) : null;
			const list = this.renderRoot.querySelector<HTMLElement>('#en-command-list');
			if (!option || !list) return;
			// Scroll the results only; never move document focus or scroll its containing page.
			const row = option.getBoundingClientRect(); const bounds = list.getBoundingClientRect();
			if (row.top < bounds.top) list.scrollTop -= bounds.top - row.top;
			else if (row.bottom > bounds.bottom) list.scrollTop += row.bottom - bounds.bottom;
		});
	}
	protected override render() {
		const view = this.#model.view.get();
		const dialog = this.dialogView;
		const initialInput = !this.hasUpdated ? this.input : null;
		const renderedOpen = initialInput ? initialInput.getAttribute('aria-expanded') === 'true' : this.open;
		return dialogTemplate({ ...dialog, surfaceClass: `${dialog.surfaceClass} en-command-palette`, surfacePart: 'surface',
			cancel: event => { if (this.#interaction.composing) event.preventDefault(); else dialog.cancel(event); },
			keyDown: event => { if (!this.#interaction.composing) dialog.keyDown(event); },
			body: commandPaletteTemplate({ searchLabel: this.searchLabel, placeholder: this.placeholder,
				emptyText: this.emptyText, open: renderedOpen, commands: view.commands, active: view.active }, this.#interaction),
		});
	}
}

declare global { interface HTMLElementTagNameMap { 'en-command-palette': EnCommandPalette; } }
