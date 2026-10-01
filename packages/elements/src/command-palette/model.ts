import { Signal } from 'signal-polyfill';

/** A plain command identity and searchable text; shortcuts are presentation only. */
export interface CommandPaletteCommand {
	readonly action: string;
	readonly label: string;
	readonly keywords?: readonly string[];
	readonly disabled?: boolean;
	readonly shortcut?: string;
}
export interface CommandCandidate extends CommandPaletteCommand { readonly id: string; }

/** Atomic catalog validation prevents ambiguous command identities. */
export function commandSnapshot(value: readonly CommandPaletteCommand[]): readonly CommandPaletteCommand[] {
	if (!Array.isArray(value)) throw new TypeError('commands must be an array.');
	const actions = new Set<string>();
	return Object.freeze(value.map(command => {
		if (!command || typeof command.action !== 'string' || !command.action.trim()
			|| typeof command.label !== 'string' || !command.label.trim() || actions.has(command.action)
			|| (command.disabled !== undefined && typeof command.disabled !== 'boolean')
			|| (command.shortcut !== undefined && typeof command.shortcut !== 'string')
			|| (command.keywords !== undefined && (!Array.isArray(command.keywords)
				|| command.keywords.some((word: unknown) => typeof word !== 'string')))) {
			throw new TypeError('Commands require unique nonempty actions, nonempty labels, and typed optional fields.');
		}
		actions.add(command.action);
		return Object.freeze({ action: command.action, label: command.label,
			...(command.keywords === undefined ? {} : { keywords: Object.freeze([...command.keywords]) }),
			...(command.disabled === undefined ? {} : { disabled: command.disabled }),
			...(command.shortcut === undefined ? {} : { shortcut: command.shortcut }),
		});
	}));
}

/** A transient search/candidate model; there is no accepted command or form value. */
export function createCommandPaletteModel() {
	const commands = new Signal.State<readonly CommandPaletteCommand[]>([]);
	const query = new Signal.State('');
	const active = new Signal.State<string | undefined>(undefined);
	const filtered = new Signal.Computed<readonly CommandCandidate[]>(() => {
		const words = query.get().trim().toLowerCase().split(/\s+/).filter(Boolean);
		return commands.get().filter(command => {
			const text = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase();
			return words.every(word => text.includes(word));
		}).map(command => ({ ...command, id: `en-command-${Array.from(command.action).map(character => character.codePointAt(0)!.toString(16)).join('-')}` }));
	});
	const candidate = new Signal.Computed(() => filtered.get().find(command => command.action === active.get() && !command.disabled));
	const first = (): void => { active.set(filtered.get().find(command => !command.disabled)?.action); };
	return {
		commands: new Signal.Computed(() => commands.get()),
		query: new Signal.Computed(() => query.get()),
		view: new Signal.Computed(() => ({ commands: filtered.get(), active: candidate.get() })),
		setCommands(value: readonly CommandPaletteCommand[]): void {
			commands.set(commandSnapshot(value));
			if (!candidate.get()) first();
		},
		setQuery(value: string): void { if (query.get() !== value) { query.set(value); first(); } },
		reset(): void { query.set(''); first(); },
		activate(action: string): void { if (filtered.get().some(command => command.action === action && !command.disabled)) active.set(action); },
		move(direction: 1 | -1): void {
			const available = filtered.get().filter(command => !command.disabled);
			const index = available.findIndex(command => command.action === active.get());
			const next = index < 0 ? (direction === 1 ? 0 : available.length - 1) : Math.max(0, Math.min(available.length - 1, index + direction));
			active.set(available[next]?.action);
		},
	};
}
