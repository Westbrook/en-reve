/** Review metadata only. Selecting a scenario never starts a simulated request. */
export type SettingsScenarioId = 'explore' | 'commands' | 'validation' | 'save-retry' | 'pending-save' | 'incoming-update';
export type SettingsScenarioControl = 'shortcut' | 'save-result' | 'delivery' | 'queue-incoming' | 'deliver-held';

export interface SettingsScenario {
	readonly id: SettingsScenarioId;
	readonly label: string;
	readonly title: string;
	readonly description: string;
	readonly path: string;
	readonly file: string;
	readonly steps: readonly string[];
	readonly expected: readonly string[];
	readonly controls: readonly SettingsScenarioControl[];
	readonly controlsDescription: string;
	readonly preset: Readonly<{ saveOutcome: 'success' | 'failure'; delivery: 'delayed' | 'held' }>;
}

export const settingsScenarios: readonly SettingsScenario[] = [
	{
		id: 'explore', label: 'Explore', title: 'Design settings',
		description: 'Adjust a shared design and explore all of its commands and simulated responses.',
		path: '/workflows/settings', file: 'workflows/settings.html',
		steps: [], expected: [],
		controls: ['shortcut', 'save-result', 'delivery', 'queue-incoming', 'deliver-held'],
		controlsDescription: 'All simulation controls are available for open-ended review.',
		preset: { saveOutcome: 'success', delivery: 'delayed' },
	},
	{
		id: 'commands', label: 'Commands', title: 'Compare command entry points',
		description: 'Use the toolbar, menu and command search to restore the same setting.',
		path: '/workflows/settings/commands', file: 'workflows/settings/commands.html',
		steps: [
			'Change Layer opacity to 72 and Output format to SVG. Use Restore saved opacity in the toolbar.',
			'Change opacity to 72 again. Open More settings actions and choose Restore saved opacity; repeat through Search commands.',
			'Search for an unknown command, then clear the query. Inspect the unavailable commands and press Escape without choosing.',
			'Optionally enable Ctrl/⌘+K below and try it while editing a field. Disable it or reset before leaving this review.',
		],
		expected: [
			'Every entry point restores opacity to 64% while preserving SVG and the other settings.',
			'Searching, navigating, unavailable commands and Escape do not execute an action. Closing search returns focus to its opener.',
			'The visible menu and search buttons work without enabling a shortcut.',
		],
		controls: ['shortcut'],
		controlsDescription: 'No simulated response is needed for this comparison. The shortcut is optional and starts disabled.',
		preset: { saveOutcome: 'success', delivery: 'delayed' },
	},
	{
		id: 'validation', label: 'Validation', title: 'Recover from invalid input',
		description: 'Find and correct an invalid exact value without losing the accepted preview.',
		path: '/workflows/settings/validation', file: 'workflows/settings/validation.html',
		steps: [
			'Enter 101 in the Layer opacity exact editor. Open Search commands, find Save settings and choose it.',
			'Check the field error, then replace 101 with 72 and press Enter. Use Save settings again.',
		],
		expected: [
			'The palette closes before focus reaches the invalid exact editor. Its 101 draft remains visible, the preview stays at the accepted 64%, and no save starts.',
			'Correcting the entry updates the preview. Saving succeeds after 1.2 seconds and the saved snapshot contains 72% opacity.',
		],
		controls: [],
		controlsDescription: 'No extra setup is needed. Reset restores a valid 64% opacity and the original saved snapshot.',
		preset: { saveOutcome: 'success', delivery: 'delayed' },
	},
	{
		id: 'save-retry', label: 'Save and retry', title: 'Recover from a failed save',
		description: 'Retry a failed save while keeping every local edit.',
		path: '/workflows/settings/save-retry', file: 'workflows/settings/save-retry.html',
		steps: [
			'Change Layer opacity to 72, then choose Save settings. The first save is set to fail after 1.2 seconds.',
			'When the failure appears, choose Retry save without re-entering your settings.',
			'Reset to repeat the failure, or change Settings save result to choose the next response.',
		],
		expected: [
			'Failure preserves your local 72% opacity and leaves the saved snapshot at revision 1.',
			'Retry succeeds after 1.2 seconds unless you choose another failure. The saved snapshot then matches your local settings.',
		],
		controls: ['save-result'],
		controlsDescription: 'Reset sets the next save to Fail next save. Each request consumes that choice and leaves Succeed selected for the next attempt.',
		preset: { saveOutcome: 'failure', delivery: 'delayed' },
	},
	{
		id: 'pending-save', label: 'Pending save', title: 'Keep editing during a pending save',
		description: 'Compare a captured save with later edits, then cancel or reset a pending response.',
		path: '/workflows/settings/pending-save', file: 'workflows/settings/pending-save.html',
		steps: [
			'Change Layer opacity to 72 and choose Save settings. The response waits for Deliver held response.',
			'While the save is pending, change Output format to SVG. Use Deliver held response below.',
			'Save again, then choose Cancel save. Finally, start another save and reset while it is pending.',
		],
		expected: [
			'The first saved snapshot contains 72% opacity and PNG. Your later SVG edit stays local and unsaved.',
			'Cancel save stops waiting and preserves your local settings. It does not claim to undo persistence that already finished.',
			'Reset cancels pending responses and restores revision 1, 64% opacity and PNG. No old response replaces the reset state.',
		],
		controls: ['deliver-held'],
		controlsDescription: 'Responses are held until you explicitly deliver them. Cancel save stops waiting; Reset clears pending responses and keeps this held-response preset.',
		preset: { saveOutcome: 'success', delivery: 'held' },
	},
	{
		id: 'incoming-update', label: 'Incoming update', title: 'Review an incoming update',
		description: 'Review a collaborator’s opacity change while preserving your unfinished work.',
		path: '/workflows/settings/incoming-update', file: 'workflows/settings/incoming-update.html',
		steps: [
			'Change Output format to SVG. Queue collaborator update, then continue editing opacity or open Search commands while the response arrives.',
			'An incoming opacity of 82% appears separately. Use Review incoming change, then Keep my opacity to retain your entry.',
			'Reset and repeat, this time choosing Use updated opacity. For a response you release yourself, choose Hold until delivered before queuing it.',
		],
		expected: [
			'Arrival does not replace your editor, query or focus. The incoming value remains separate, and saving waits for review.',
			'Keep preserves your opacity and unfinished entry. Use deliberately replaces opacity with 82%. Both preserve unrelated local settings such as SVG.',
			'Command availability reflects the current incoming update, so an earlier view cannot bypass review.',
		],
		controls: ['delivery', 'queue-incoming', 'deliver-held'],
		controlsDescription: 'Queue an update only when ready. After 1.2 seconds is the default; Hold until delivered lets you control the arrival explicitly.',
		preset: { saveOutcome: 'success', delivery: 'delayed' },
	},
];

export function getSettingsScenario(id: SettingsScenarioId): SettingsScenario {
	return settingsScenarios.find(scenario => scenario.id === id) ?? settingsScenarios[0]!;
}
