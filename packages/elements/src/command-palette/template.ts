import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { CommandCandidate } from './model.js';

export interface CommandPaletteView {
	readonly searchLabel: string;
	readonly placeholder: string;
	readonly emptyText: string;
	readonly open: boolean;
	readonly commands: readonly CommandCandidate[];
	readonly active?: CommandCandidate;
}
export interface CommandPaletteEvents {
	input(event: InputEvent): void;
	compositionStart(): void;
	compositionEnd(): void;
	keydown(event: KeyboardEvent): void;
	mousedown(event: MouseEvent): void;
	pointerDown(event: PointerEvent): void;
	pointerMove(event: PointerEvent): void;
	pointerCancel(): void;
	scroll(): void;
	click(event: MouseEvent): void;
}

/** All ID references are within the modal's one shadow root. The native editor owns its text. */
export function commandPaletteTemplate(view: CommandPaletteView, events: CommandPaletteEvents) {
	return html`<div class="en-command-palette-content">
		<label class="en-label" for="en-command-search" id="en-command-search-label">${view.searchLabel}</label>
		<div class="en-field-focus-frame" part="focus-frame">
			<input class="en-input en-text-input en-command-palette-input" part="control" id="en-command-search"
				type="text" role="combobox" autocomplete="off" spellcheck="false" autofocus
				aria-autocomplete="list" aria-haspopup="listbox" aria-expanded=${String(view.open)}
				aria-controls="en-command-list" aria-activedescendant=${view.open ? view.active?.id ?? nothing : nothing}
				placeholder=${view.placeholder || nothing} value=""
				@input=${events.input} @compositionstart=${events.compositionStart} @compositionend=${events.compositionEnd} @keydown=${events.keydown}>
		</div>
		<div class="en-command-list" part="listbox" role="listbox" tabindex="-1" id="en-command-list" aria-labelledby="en-command-search-label"
			@pointerdown=${events.pointerDown} @pointermove=${events.pointerMove} @pointercancel=${events.pointerCancel} @scroll=${events.scroll}>
			${repeat(view.commands, command => command.action, command => html`<div class="en-command-option" part="option" role="option"
				id=${command.id} data-action=${command.action} ?data-active=${command.action === view.active?.action}
				aria-selected=${String(command.action === view.active?.action)} aria-disabled=${String(Boolean(command.disabled))}
				@mousedown=${events.mousedown} @click=${events.click}>
				<span class="en-command-label">${command.label}</span>
				${command.shortcut ? html`<span class="en-command-shortcut">${command.shortcut}</span>` : nothing}
			</div>`)}
		</div>
		<p class="en-command-status" part="status" role="status" aria-live="polite" aria-atomic="true">${view.commands.length ? nothing : view.emptyText}</p>
		<slot></slot>
	</div>`;
}
