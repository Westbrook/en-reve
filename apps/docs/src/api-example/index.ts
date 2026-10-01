const flagged = new URLSearchParams(location.search).has('progress-report');
if (flagged) {
	document.querySelector<HTMLElement>('.progress-return')?.removeAttribute('hidden');
	for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
		const url = new URL(link.href);
		if (url.origin !== location.origin) continue;
		url.searchParams.set('progress-report', '');
		link.href = url.href;
	}
}
