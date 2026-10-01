/** Local fixture data. Theme changes never replace this state or its controls. */
export const people = [
	{ value: 'ada', label: 'Ada Lovelace' },
	{ value: 'rafael', label: 'Rafael Silva' },
	{ value: 'jun', label: 'Jun Park' },
];
export const activity = {
	week: [{ label: 'Mon', value: 12 }, { label: 'Tue', value: 26 }, { label: 'Wed', value: 19 }, { label: 'Thu', value: 32 }, { label: 'Fri', value: 23 }, { label: 'Sat', value: 8 }],
	month: [{ label: 'Apr', value: 78 }, { label: 'May', value: 104 }, { label: 'Jun', value: 86 }, { label: 'Jul', value: 124 }, { label: 'Aug', value: 96 }, { label: 'Sep', value: 112 }],
};
export const commands = [
	{ action: 'portrait', label: 'Portrait canvas', keywords: ['tall', 'layout'] },
	{ action: 'landscape', label: 'Landscape canvas', keywords: ['wide', 'layout'] },
	{ action: 'reset-canvas', label: 'Reset canvas', keywords: ['default'] },
];
export function createShowcaseState() {
	return {
		canvas: 'portrait', activityRange: 'week' as keyof typeof activity,
		ready: [true, true, false, false], project: '', projectStatus: '',
		opacity: 82, scale: 100, accent: '#6d5ce7',
		members: ['Mira Chen', 'Omar Haddad'], invitationStatus: '',
		messages: [] as { id: number; who: string; text: string }[],
		chatStatus: '', feedback: '', accessStatus: '', notificationStatus: '',
		approved: false, inserted: false, shareStatus: '',
	};
}
export type ShowcaseState = ReturnType<typeof createShowcaseState>;
export type CardId = 'actions' | 'navigation' | 'brief' | 'brand' | 'activity' | 'readiness' | 'asset' | 'feedback' | 'project' | 'output' | 'access' | 'notifications' | 'team' | 'chat' | 'share' | 'library';
export const cardIds: CardId[] = ['actions', 'navigation', 'brief', 'brand', 'activity', 'readiness', 'asset', 'feedback', 'project', 'output', 'access', 'notifications', 'team', 'chat', 'share', 'library'];
