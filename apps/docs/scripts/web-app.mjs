/** Shared install metadata for authored and generated docs pages, in dev and builds. */
export function installableDocument(html, base = '/') {
  const head = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];
  if (!head) return html;
  const asset = path => `${base}${path}`;
  const metadata = `
<link rel="manifest" crossorigin="use-credentials" href="${asset('manifest.json')}">
<link rel="icon" type="image/svg+xml" sizes="any" href="${asset('favicon.svg')}">
<link rel="icon" type="image/png" sizes="32x32" href="${asset('favicon.png')}">
<link rel="apple-touch-icon" sizes="180x180" href="${asset('apple-touch-icon.png')}">
<meta name="application-name" content="En Rêve">
<meta name="apple-mobile-web-app-title" content="En Rêve">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#2457d6">
<link rel="stylesheet" href="${asset('installed-app.css')}">
`;
  // The authored shells already contain favicons and a zoom-enabled viewport.
  // Replace only their head metadata; specimens may show similar markup as code.
  const updated = head
    .replace(/<link\b(?=[^>]*\brel=["'](?:icon|apple-touch-icon)["'])[^>]*>/gi, '')
    .replace(/(<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*\bcontent=["'])([^"']*)(["'])/i,
      (_, before, value, after) => `${before}${value.replace(/,?\s*viewport-fit\s*=\s*[^,]+/g, '')},viewport-fit=cover${after}`)
    .replace(/<\/head>/i, `${metadata}</head>`);
  return html.replace(head, updated);
}

export function webAppPlugin() {
  let base = '/';
  return {
    name: 'en-reve-installed-app',
    configResolved(config) { base = config.base; },
    transformIndexHtml: { order: 'post', handler(html) { return installableDocument(html, base); } },
  };
}
