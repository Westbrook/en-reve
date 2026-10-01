import { html } from 'lit';

export function fixtureTemplate({ hidden = false, navigationHidden = false } = {}) {
	return html`
		<en-navigation id="section-navigation" .label=${'Workspace sections'}>
			<a id="navigation-overview" href="#overview" aria-current="location">Overview</a>
			<a id="navigation-details" href="#details" ?hidden=${navigationHidden}>Details</a>
			<a id="navigation-preview" href="/destination" target="_blank" rel="noopener">Open preview</a>
			<a id="navigation-cancelled" href="#cancelled">Cancelled destination</a>
		</en-navigation>
		<en-breadcrumbs id="breadcrumb-navigation" .label=${'Project path'}>
			<a id="breadcrumb-home" href="/fixture?from=home"><strong>Home</strong></a>
			<a id="breadcrumb-projects" href="#overview" ?hidden=${hidden}>Projects</a>
			<span id="breadcrumb-current" aria-current="page">Current document</span>
		</en-breadcrumbs>
	`;
}


/** Independent plain-DOM client construction; no array/property breadcrumb API. */
export function appendBreadcrumbChildren(host, { hidden = false } = {}) {
	const home = document.createElement('a');
	home.id = 'breadcrumb-home'; home.href = '/fixture?from=home';
	const strong = document.createElement('strong'); strong.textContent = 'Home'; home.append(strong);
	const projects = document.createElement('a');
	projects.id = 'breadcrumb-projects'; projects.href = '#overview'; projects.textContent = 'Projects'; projects.hidden = hidden;
	const current = document.createElement('span');
	current.id = 'breadcrumb-current'; current.setAttribute('aria-current', 'page'); current.textContent = 'Current document';
	host.append(home, projects, current);
}


/** A client consumer can create the same navigation using native DOM methods. */
export function appendNavigationChildren(host, { navigationHidden = false } = {}) {
	const overview = document.createElement('a');
	overview.id = 'navigation-overview'; overview.href = '#overview'; overview.textContent = 'Overview'; overview.setAttribute('aria-current', 'location');
	const details = document.createElement('a');
	details.id = 'navigation-details'; details.href = '#details'; details.textContent = 'Details'; details.hidden = navigationHidden;
	const preview = document.createElement('a');
	preview.id = 'navigation-preview'; preview.href = '/destination'; preview.textContent = 'Open preview'; preview.target = '_blank'; preview.rel = 'noopener';
	const cancelled = document.createElement('a');
	cancelled.id = 'navigation-cancelled'; cancelled.href = '#cancelled'; cancelled.textContent = 'Cancelled destination';
	host.append(overview, details, preview, cancelled);
}
