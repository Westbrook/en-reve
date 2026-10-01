/** Local, deterministic application data. The library owns neither this catalog nor project access. */
export const projectItems = Object.freeze([
	{ value: 'project-01', label: 'Studio North · Autumn campaign' },
	{ value: 'project-02', label: 'Studio North · Brand library' },
	{ value: 'project-03', label: 'Studio North · Editorial series' },
	{ value: 'project-04', label: 'Studio South · Product launch' },
	{ value: 'project-05', label: 'Studio South · Packaging study' },
	{ value: 'project-06', label: 'Studio East · Community stories' },
	{ value: 'project-07', label: 'Studio East · Archive (unavailable)', disabled: true },
	{ value: 'project-08', label: 'Studio West · Motion studies' },
	{ value: 'project-09', label: 'Atlas · Annual report' },
	{ value: 'project-10', label: 'Atlas · Website refresh' },
	{ value: 'project-11', label: 'Beacon · Wayfinding' },
	{ value: 'project-12', label: 'Beacon · Event identity' },
	{ value: 'project-13', label: 'Cedar · Product photography' },
	{ value: 'project-14', label: 'Cedar · Social templates' },
	{ value: 'project-15', label: 'Drift · Summer collection' },
	{ value: 'project-16', label: 'Drift · Lookbook' },
	{ value: 'project-17', label: 'Elm · Learning materials' },
	{ value: 'project-18', label: 'Elm · Illustration system' },
	{ value: 'project-19', label: 'Fieldwork · Archive (unavailable)', disabled: true },
	{ value: 'project-20', label: 'Fieldwork · Research stories' },
	{ value: 'project-21', label: 'Grove · Exhibition' },
	{ value: 'project-22', label: 'Grove · Visitor guide' },
	{ value: 'project-23', label: 'Harbor · Digital collection' },
	{ value: 'project-24', label: 'Harbor · Membership welcome' },
	{ value: 'project-25', label: 'Iris · Magazine covers' },
	{ value: 'project-26', label: 'Iris · Interview series' },
	{ value: 'project-27', label: 'Juniper · Store launch' },
	{ value: 'project-28', label: 'Juniper · Seasonal signage' },
	{ value: 'project-29', label: 'Kite · Mobile onboarding' },
	{ value: 'project-30', label: 'Kite · Help center' },
	{ value: 'project-31', label: 'Lumen · Accessibility guide' },
	{ value: 'project-32', label: 'Lumen · International community exhibition and extended visitor information' },
	{ value: 'project-33', label: 'Meadow · Archive (unavailable)', disabled: true },
	{ value: 'project-34', label: 'Meadow · Field notes' },
	{ value: 'project-35', label: 'Orbit · Design conference' },
	{ value: 'project-36', label: 'Orbit · Speaker materials' },
	{ value: 'project-37', label: 'Pine · Welcome kit' },
	{ value: 'project-38', label: 'Pine · Team handbook' },
	{ value: 'project-39', label: 'Willow · Winter campaign' },
	{ value: 'project-40', label: 'Willow · Year in review' },
]);

export interface SelectionState {
	acceptedId: string;
	submission?: { sequence: number; id: string; label: string };
	status: string;
}

export function createSelectionState(): SelectionState {
	return { acceptedId: 'project-01', status: '' };
}
