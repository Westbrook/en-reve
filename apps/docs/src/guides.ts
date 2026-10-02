// The report URL is trusted project configuration, never a query parameter value.
if (new URLSearchParams(location.search).has('progress-report')) {
  const link = document.querySelector<HTMLElement>('#progress-return');
  if (link) link.hidden = false;
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')) {
    const url = new URL(anchor.href);
    url.searchParams.set('progress-report', '');
    anchor.href = url.href;
  }
}
